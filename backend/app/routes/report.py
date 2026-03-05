from fastapi import APIRouter, HTTPException, Depends
from app.dependencies import verify_token
from app.supabase_client import supabase

router = APIRouter(prefix="/report", tags=["Report"])

@router.get("/{report_id}")
async def get_full_report(report_id: str, user=Depends(verify_token)):
    user_id = user["sub"]

    data = supabase.from_("reports").select("""
        id, file_name, uploaded_at,
        analysis (
            parameters, analysis_map,
            nlp_explanation, severity
        ),
        recommendations (
            lifestyle_tips, non_prescription
        )
    """).eq("id", report_id) \
      .eq("user_id", user_id) \
      .single() \
      .execute()

    if not data.data:
        raise HTTPException(status_code=404, detail="Report not found")

    r = data.data

    # ✅ Supabase returns related tables as lists — get first item
    a   = r["analysis"][0]   if isinstance(r["analysis"],   list) else r["analysis"]
    rec = r["recommendations"][0] if isinstance(r["recommendations"], list) else r["recommendations"]

    if not a:
        raise HTTPException(status_code=404, detail="Analysis not found for this report")
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendations not found for this report")

    # ── Flatten lifestyle_tips ─────────────────────────────────────────
    # lifestyle_tips can be:
    # [{ "parameter": "x", "tips": ["tip1", "tip2"] }]  → flatten to ["tip1", "tip2"]
    # OR already a flat list of strings ["tip1", "tip2"]
    raw_lifestyle = rec.get("lifestyle_tips", [])
    if raw_lifestyle and isinstance(raw_lifestyle[0], dict):
        lifestyle = [tip for group in raw_lifestyle for tip in group.get("tips", [])]
    else:
        lifestyle = raw_lifestyle  # already flat

    # ── Flatten non_prescription ───────────────────────────────────────
    # non_prescription can be:
    # [{ "parameter": "x", "options": ["opt1", "opt2"] }]  → flatten
    # OR already a flat list of strings
    raw_non_prescription = rec.get("non_prescription", [])
    if raw_non_prescription and isinstance(raw_non_prescription[0], dict):
        non_prescription = [opt for group in raw_non_prescription for opt in group.get("options", [])]
    else:
        non_prescription = raw_non_prescription  # already flat

    return {
        "report": {
            "name":   r["file_name"],
            "date":   r["uploaded_at"],
            "status": a.get("severity", "Normal"),
        },
        "parameters":      a.get("parameters", []),
        "nlp_explanation": a.get("nlp_explanation", []),
        "recommendations": {
            "lifestyle":        lifestyle,
            "non_prescription": non_prescription,
        }
    }