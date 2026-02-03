from fastapi import APIRouter, UploadFile, File
from app.config import UPLOAD_DIR
import os

router = APIRouter()

@router.post("/")
async def upload_report(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    return {
        "file_id": file.filename,
        "status": "uploaded"
    }
@router.get("/")
def test_upload():
    return {"message": "Upload route works"}
