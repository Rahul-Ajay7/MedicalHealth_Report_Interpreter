import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from app.dependencies import verify_token
from app.supabase_client import supabase
from app.services.audit import audit
from app.state.chat_sessions import delete_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/history", tags=["History"])


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.get("/")
async def get_history(request: Request, user=Depends(verify_token)):
    """
    Returns all reports for the logged-in user.
    RLS on Supabase ensures users only see their own data.
    """
    user_id = user["sub"]
    audit("report_list", user_id=user_id, ip=_client_ip(request))

    data = supabase.from_("reports").select("""
        id,
        file_name,
        uploaded_at,
        analysis (
            severity
        )
    """).eq("user_id", user_id) \
      .order("uploaded_at", desc=True) \
      .execute()

    if not data.data:
        return { "reports": [] }

    # Flatten into clean response shape
    reports = [
        {
            "id":        r["id"],
            "name":      r["file_name"],
            "date":      r["uploaded_at"],
            "severity":  r["analysis"][0]["severity"] if r["analysis"] else "Normal"
        }
        for r in data.data
    ]

    return { "reports": reports }


@router.get("/test")
def test_history():
    return {"message": "History route works"}

@router.delete("/{report_id}")
async def delete_report(report_id: str, request: Request, user=Depends(verify_token)):
    """
    Hard-delete a report and ALL associated PII:
      • the uploaded file in Supabase Storage
      • analysis + recommendations rows
      • the reports row
      • any in-memory/Redis chat session
    Ownership is verified first; the action is audited.
    """
    user_id = user["sub"]
    ip = _client_ip(request)

    # ── Verify ownership (also fetch ext for the storage path) ────────────────
    response = supabase.from_("reports") \
        .select("id, file_type") \
        .eq("id", report_id) \
        .eq("user_id", user_id) \
        .execute()

    if not response.data:
        audit("report_delete", user_id=user_id, report_id=report_id,
              ip=ip, status="not_found")
        raise HTTPException(status_code=404, detail="Report not found")

    ext = (response.data[0].get("file_type") or "").lower()

    # ── Delete the stored file (best-effort — never leave orphan PHI) ─────────
    if ext:
        try:
            supabase.storage.from_("reports").remove([f"{user_id}/{report_id}.{ext}"])
        except Exception as e:
            logger.error("Storage delete failed | report_id=%s | %s", report_id, e)

    # ── Delete child rows (in case DB has no ON DELETE CASCADE) ───────────────
    for table in ("analysis", "recommendations"):
        try:
            supabase.from_(table).delete().eq("report_id", report_id).execute()
        except Exception as e:
            logger.error("Child delete failed | table=%s | report_id=%s | %s",
                         table, report_id, e)

    # ── Delete the report row ─────────────────────────────────────────────────
    delete_res = supabase.from_("reports") \
        .delete() \
        .eq("id", report_id) \
        .eq("user_id", user_id) \
        .execute()

    if not delete_res.data:
        audit("report_delete", user_id=user_id, report_id=report_id,
              ip=ip, status="error")
        raise HTTPException(status_code=500, detail="Failed to delete report")

    # ── Drop any chat session tied to this report ─────────────────────────────
    delete_session(report_id)

    audit("report_delete", user_id=user_id, report_id=report_id, ip=ip)
    return {"message": "Deleted successfully"}