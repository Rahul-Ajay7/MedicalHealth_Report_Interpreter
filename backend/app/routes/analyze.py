from fastapi import APIRouter, HTTPException
from app.config import UPLOAD_DIR
import os

from app.services.ocr import extract_text_from_file
from app.services.parser import parse_report_text
from app.services.analyzer import analyze_parameters

router = APIRouter(prefix="/analyze", tags=["Analyze"])


@router.post("/")
def analyze_report(file_id: str, gender: str):
    """
    file_id = uploaded filename
    gender = "male" or "female"
    """

    file_path = os.path.join(UPLOAD_DIR, file_id)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found in uploads folder")

    # 1️⃣ OCR
    raw_text = extract_text_from_file(file_path)

    if not raw_text or len(raw_text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file does not contain readable medical text"
        )

    # 2️⃣ Parser
    parsed_values = parse_report_text(raw_text)

    # 3️⃣ Analyzer (NORMAL_RANGES based)
    final_results = analyze_parameters(
        parsed_values,
        gender=gender
    )

    return {
        "file_id": file_id,
        "gender": gender,
        "parsed_values": parsed_values,
        "final_results": final_results
    }
