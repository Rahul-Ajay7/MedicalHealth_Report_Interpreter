from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
from app.dependencies import verify_token
from app.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB, SIGNED_URL_TTL
from app.supabase_client import supabase
from app.services.audit import audit, client_ip
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["Upload"])

_ALLOWED = {e.strip().lower() for e in ALLOWED_EXTENSIONS}
_MAX_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def _sign(storage_path: str) -> str:
    """Mint a short-lived signed URL for a private-bucket object, or "" on failure."""
    try:
        res = supabase.storage.from_("reports").create_signed_url(
            storage_path, SIGNED_URL_TTL
        )
        if isinstance(res, dict):
            return res.get("signedURL") or res.get("signedUrl") or ""
        return ""
    except Exception:
        logger.warning("Failed to sign storage URL", exc_info=True)
        return ""


@router.post("/")
async def upload_report(
    request: Request,
    file: UploadFile = File(...),
    user=Depends(verify_token)
):

    user_id   = user["sub"]
    report_id = str(uuid.uuid4())

    # ── Validate filename + extension (block executables / unexpected types) ──
    if not file.filename or "." not in file.filename:
        raise HTTPException(status_code=400, detail="File must have a name and extension.")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in _ALLOWED:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Allowed: {', '.join(sorted(_ALLOWED))}.",
        )

    # 1. Read file bytes + enforce size limit
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(file_bytes) > _MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {MAX_FILE_SIZE_MB} MB limit.",
        )

    # 2. Upload to Supabase Storage → reports/{user_id}/{report_id}.{ext}
    storage_path = f"{user_id}/{report_id}.{ext}"
    supabase.storage.from_("reports").upload(
        storage_path,
        file_bytes,
        {"content-type": file.content_type}
    )

    # 3. Persist the STORAGE PATH (stable) — the bucket is private, so a public
    #    URL would 403 and a signed URL would expire; store the path and mint
    #    short-lived signed URLs on demand instead.
    report = supabase.table("reports").insert({
        "id":        report_id,
        "user_id":   user_id,
        "file_name": file.filename,
        "file_url":  storage_path,
        "file_type": ext,
    }).execute().data[0]

    # 4. Short-lived signed URL for the client to preview right after upload
    file_url = _sign(storage_path)

    audit("report_upload", user_id=user_id, report_id=report_id, ip=client_ip(request))

    return {
        "report_id": report_id,
        "file_url":  file_url,
        "status":    "uploaded"
    }