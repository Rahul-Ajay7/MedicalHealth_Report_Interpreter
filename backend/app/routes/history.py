from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import verify_token
from app.supabase_client import supabase

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/")
async def get_history(user=Depends(verify_token)):
    """
    Returns all reports for the logged-in user.
    RLS on Supabase ensures users only see their own data.
    """
    user_id = user["sub"]

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