from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict

from app.services.llm_chat import PatientChatLLM


router = APIRouter(prefix="/chat", tags=["Chat"])

llm = PatientChatLLM()


class ChatRequest(BaseModel):
    question: str
    analyzed_results: List[Dict]
    medical_data: Dict


class ChatResponse(BaseModel):
    answer: str


@router.post("/", response_model=ChatResponse)
def chat_with_patient(data: ChatRequest):
    explanations = []

    for r in data.analyzed_results:
        text = generate_nlp_explanation(r, data.medical_data)
        if text:
            explanations.append(text)

    answer = llm.answer_question(
        question=data.question,
        report_summary=data.analyzed_results,
        explanations=explanations
    )

    return {"answer": answer}
