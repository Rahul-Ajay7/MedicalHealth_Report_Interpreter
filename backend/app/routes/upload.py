from fastapi import APIRouter, UploadFile, File, Depends
from app.dependencies import verify_token
from app.supabase_client import supabase
import uuid
import os

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/")
async def upload_report(
    file: UploadFile = File(...),
    user=Depends(verify_token)         # ✅ JWT auth — gets user_id from token
):
    user_id   = user["sub"]
    report_id = str(uuid.uuid4())
    ext       = file.filename.split(".")[-1].lower()

    # 1. Read file bytes
    file_bytes = await file.read()

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

    return {
        "report_id": report_id,
        "file_url":  file_url,
        "status":    "uploaded"
    }


@router.get("/")
def test_upload():
    return {"message": "Upload route works"}