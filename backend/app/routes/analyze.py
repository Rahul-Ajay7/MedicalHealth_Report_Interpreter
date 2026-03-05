from fastapi import APIRouter, HTTPException, Depends
import os
import json
import tempfile

from app.dependencies import verify_token
from app.supabase_client import supabase
from app.services.ocr import extract_text_from_file
from app.services.parser import parse_report_text
from app.services.analyzer import analyze_parameters
from app.services.recommendations import generate_recommendations
from app.services.nlp import generate_nlp_explanations
from app.state.chat_sessions import CHAT_SESSIONS

router = APIRouter(prefix="/analyze", tags=["Analyze"])

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
    user=Depends(verify_token)
):
    user_id = user["sub"]

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

        # ── 9. Recommendations ─────────────────────────────────────────
        recommendations = generate_recommendations(
            final_results=final_results,
            gender=gender
        )

        # ── 10. Convert dict → list for parameters (frontend table) ────
        # { "haemoglobin": { value, unit, status } }
        # → [ { "name": "haemoglobin", value, unit, status } ]
        parameters_list = [
            { "name": name, **data }
            for name, data in final_results.items()
        ]

        # ── 11. Determine severity from dict values ─────────────────────
        statuses = [
            v.get("status", "normal").lower()
            for v in final_results.values()
            if isinstance(v, dict)
        ]
        if any(s == "high" for s in statuses):
            severity = "High"
        elif any(s in ("low", "abnormal") for s in statuses):
            severity = "Medium"
        else:
            severity = "Normal"

        # ── 12. Save analysis to Supabase ──────────────────────────────
        supabase.table("analysis").insert({
            "report_id":       report_id,
            "user_id":         user_id,
            "parameters":      parameters_list,   # ✅ list for frontend table
            "analysis_map":    final_results,      # ✅ dict for quick lookup
            "nlp_explanation": nlp_explanation if isinstance(nlp_explanation, list)
                               else [nlp_explanation],
            "severity":        severity,
        }).execute()

        # ── 13. Save recommendations to Supabase ───────────────────────
        supabase.table("recommendations").insert({
            "report_id":        report_id,
            "user_id":          user_id,
            "lifestyle_tips":   recommendations.get("lifestyle_tips",   []),
            "non_prescription": recommendations.get("non_prescription", []),
        }).execute()

        # ── 14. Store chat session ─────────────────────────────────────
        CHAT_SESSIONS[file_id] = {
            "analysis":        final_results,
            "nlp_explanation": nlp_explanation,
            "gender":          gender,
        }

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
    }