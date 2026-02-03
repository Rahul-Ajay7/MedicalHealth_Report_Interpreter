# upload.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/analyze")
def test_upload():
    return {"message": "Upload route works"}
