from fastapi import APIRouter, HTTPException
import os
import json

from app.config import UPLOAD_DIR
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
def analyze_report(file_id: str, gender: str):
    file_path = os.path.join(UPLOAD_DIR, file_id)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # OCR
    raw_text = extract_text_from_file(file_path)
    if not raw_text or len(raw_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Unreadable medical text")

    # Parse
    parsed_values = parse_report_text(raw_text)

    # Analyze
    final_results = analyze_parameters(parsed_values, gender=gender)

    # Load medical knowledge ONCE here
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        medical_data = json.load(f)

    # NLP explanation
    nlp_explanation = generate_nlp_explanations(
        analysis_results=final_results,
        medical_data=medical_data
    )

    # Recommendations
    recommendations = generate_recommendations(
        final_results=final_results,
        gender=gender
    )

    # 🔥 STORE SESSION (THIS IS THE KEY)
    CHAT_SESSIONS[file_id] = {
        "analysis": final_results,
        "nlp_explanation": nlp_explanation,
        "gender": gender,
    }

    return {
        "file_id": file_id,
        "gender": gender,
        "analysis": final_results,
        "nlp_explanation": nlp_explanation,
        "recommendations": recommendations
    }