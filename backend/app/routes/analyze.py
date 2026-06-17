from fastapi import APIRouter, HTTPException, Depends, Request
import os
import json
import tempfile
import logging

from app.dependencies import verify_token
from app.services.audit import audit, client_ip
from app.services.languages import normalize_language
from app.supabase_client import supabase
from app.services.ocr import extract_text_from_file
from app.services.parser import parse_report_text
from app.services.analyzer import analyze_parameters
from app.services.recommendations import generate_recommendations
from app.services.nlp import generate_nlp_explanations
from app.services.llm_chat import translate_lines
from app.services.languages import is_english
from app.state.chat_sessions import set_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["Analyze"])


def _localize_recommendations(rec: dict, language: str) -> dict:
    """Translate the patient-facing strings in recommendations into `language`.
    Keeps `parameter` (lab name) and `status` (logic) untouched. Degrades to
    English per-line on any translation failure (translate_lines handles that)."""
    if not rec or is_english(language):
        return rec

    def t1(s: str) -> str:
        return translate_lines([s], language)[0] if s else s

    for tip in rec.get("lifestyle_tips", []):
        if tip.get("tips"):
            tip["tips"] = translate_lines(tip["tips"], language)

    for otc in rec.get("non_prescription", []):
        if otc.get("options"):
            otc["options"] = translate_lines(otc["options"], language)
        if otc.get("note"):
            otc["note"] = t1(otc["note"])

    for doc in rec.get("doctor_consultation", []):
        if doc.get("conditions"):
            doc["conditions"] = translate_lines(doc["conditions"], language)
        if doc.get("instruction"):
            doc["instruction"] = t1(doc["instruction"])

    # The medical/OTC disclaimer is legal-safety text — keep the English ALWAYS
    # readable and add the translation below it (bilingual), never replace.
    if rec.get("otc_disclaimer"):
        en = rec["otc_disclaimer"]
        translated = t1(en)
        rec["otc_disclaimer"] = f"{en}\n\n{translated}" if translated and translated != en else en

    return rec

JSON_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "services",
    "medical_knowledge.json"
)


@router.post("/")
def analyze_report(
    file_id: str,
    gender: str,
    request: Request,
    language: str = "english",
    user=Depends(verify_token)
):
    user_id = user["sub"]
    audit("report_analyze", user_id=user_id, report_id=file_id, ip=client_ip(request))

    # Preferred chat/output language for this report (defaults to English)
    language = normalize_language(language) or "English"

    # ── 1. Fetch report row from Supabase ──────────────────────────────
    report_row = supabase.table("reports") \
        .select("id, file_url, file_name") \
        .eq("id", file_id) \
        .eq("user_id", user_id) \
        .single() \
        .execute()

    if not report_row.data:
        raise HTTPException(status_code=404, detail="Report not found")

    report    = report_row.data
    file_url  = report["file_url"]
    report_id = report["id"]

    # ── 2. Download file from Supabase Storage ─────────────────────────
    storage_path = f"{user_id}/{report_id}.{file_url.split('.')[-1]}"
    file_bytes   = supabase.storage.from_("reports").download(storage_path)

    # ── 3. Save to cross-platform temp path ────────────────────────────
    file_ext = file_url.split(".")[-1].lower()
    tmp_path = os.path.join(tempfile.gettempdir(), f"{report_id}.{file_ext}")
    with open(tmp_path, "wb") as f:
        f.write(file_bytes)

    try:
        # ── 4. OCR ─────────────────────────────────────────────────────
        raw_text = extract_text_from_file(tmp_path)
        if not raw_text or len(raw_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Unreadable medical text")

        # ── 5. Parse ───────────────────────────────────────────────────
        parsed_values = parse_report_text(raw_text)

        # ── 6. Analyze ─────────────────────────────────────────────────
        # final_results is a dict: { "haemoglobin": { value, unit, status, normal_range } }
        final_results = analyze_parameters(parsed_values, gender=gender)

        # ── 7. Load medical knowledge ──────────────────────────────────
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            medical_data = json.load(f)

        # ── 8. NLP explanation ─────────────────────────────────────────
        nlp_explanation = generate_nlp_explanations(
            analysis_results=final_results,
            medical_data=medical_data
        )

        # Localize the report explanation into the chosen language (graceful
        # English fallback). Chat already localizes; this closes the gap where
        # the first analysis bubble stayed English.
        if isinstance(nlp_explanation, list):
            nlp_explanation = translate_lines(nlp_explanation, language)

        # ── 9. Recommendations ─────────────────────────────────────────
        recommendations = generate_recommendations(
            final_results=final_results,
            gender=gender
        )

        # Localize lifestyle tips + OTC info into the chosen language, matching
        # the report explanation (graceful English fallback per line).
        recommendations = _localize_recommendations(recommendations, language)

        # ── 10. Convert dict → list for parameters (frontend table) ────
        # { "haemoglobin": { value, unit, status } }
        # → [ { "name": "haemoglobin", value, unit, status } ]
        parameters_list = [
            { "name": name, **data }
            for name, data in final_results.items()
        ]

        # ── 11. Determine severity from dict values ─────────────────────
        dict_vals = [v for v in final_results.values() if isinstance(v, dict)]
        statuses  = [v.get("status", "normal").lower() for v in dict_vals]
        if any(v.get("critical") for v in dict_vals):
            severity = "Critical"            # panic value → urgent attention
        elif any(s == "high" for s in statuses):
            severity = "High"
        elif any(s in ("low", "abnormal") for s in statuses):
            severity = "Medium"
        else:
            severity = "Normal"

        # ── 12. Save analysis to Supabase ──────────────────────────────
        supabase.table("analysis").insert({
            "report_id":       report_id,
            "user_id":         user_id,
            "parameters":      parameters_list,   # list for frontend table
            "analysis_map":    final_results,      #  dict for quick lookup
            "nlp_explanation": nlp_explanation if isinstance(nlp_explanation, list)
                               else [nlp_explanation],
            "severity":        severity,
        }).execute()

        # ── 12b. Tag the analysis with its output language (best-effort) ──
        # Lets the report view localize the PDF disclaimer later. Requires a
        # nullable `language` column on `analysis`; safely ignored if absent
        # so older schemas keep working.
        try:
            supabase.table("analysis").update({"language": language}) \
                .eq("report_id", report_id).eq("user_id", user_id).execute()
        except Exception as e:
            logger.warning("Store analysis language failed | report_id=%s | %s", report_id, e)

        # ── 13. Save recommendations to Supabase ───────────────────────
        supabase.table("recommendations").insert({
            "report_id":        report_id,
            "user_id":          user_id,
            "lifestyle_tips":   recommendations.get("lifestyle_tips",   []),
            "non_prescription": recommendations.get("non_prescription", []),
        }).execute()

        # ── 14. Store chat session ─────────────────────────────────────
        
        set_session(file_id, {
            "user_id":         user_id,          # for chat ownership check
            "analysis":        final_results,
            "nlp_explanation": nlp_explanation,
            "recommendations": recommendations,
            "gender":          gender,
            "language":        language,})

        # ── 14b. Delete the raw uploaded file — privacy by design ──────
        # We keep only the extracted values + summary (saved above) for the
        # user's history. The original report (PDF/image) is never retained
        # once analysis succeeds. Best-effort; never leave orphan PHI.
        try:
            supabase.storage.from_("reports").remove([storage_path])
        except Exception as e:
            logger.warning("Raw file cleanup failed | report_id=%s | %s", report_id, e)

    finally:
        # ── 15. Always cleanup temp file ───────────────────────────────
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    return {
        "file_id":         file_id,
        "report_id":       report_id,
        "gender":          gender,
        "analysis":        final_results,     # dict — for chat session
        "parameters":      parameters_list,   # list — for frontend table
        "nlp_explanation": nlp_explanation,
        "recommendations": recommendations,
        "severity":        severity,
        "language":        language,          # chosen output language (chat reuses)
    }