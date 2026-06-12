from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
from app.dependencies import verify_token
from app.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB
from app.supabase_client import supabase
from app.services.audit import audit, client_ip
import uuid

router = APIRouter(prefix="/upload", tags=["Upload"])

_ALLOWED = {e.strip().lower() for e in ALLOWED_EXTENSIONS}
_MAX_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


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

    # 3. Get the file URL
    file_url = supabase.storage.from_("reports").get_public_url(storage_path)

    # 4. Insert into reports table
    report = supabase.table("reports").insert({
        "id":        report_id,
        "user_id":   user_id,
        "file_name": file.filename,
        "file_url":  file_url,
        "file_type": ext,
    }).execute().data[0]

    audit("report_upload", user_id=user_id, report_id=report_id, ip=client_ip(request))

    return {
        "report_id": report_id,
        "file_url":  file_url,
        "status":    "uploaded"
    }


@router.get("/")
def test_upload():
    return {"message": "Upload route works"}