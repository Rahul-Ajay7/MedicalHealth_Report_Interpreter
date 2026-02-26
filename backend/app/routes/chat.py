from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.llm_chat import PatientChatLLM
from app.state.chat_sessions import CHAT_SESSIONS

router = APIRouter(prefix="/chat", tags=["Chat"])
llm = PatientChatLLM()


# ----------- Schemas -----------

class ChatRequest(BaseModel):
    file_id: str
    question: str


class ChatResponse(BaseModel):
    answer: str


# ----------- Chat Route -----------

@router.post("/", response_model=ChatResponse)
async def chat_with_llm(data: ChatRequest):
    session = CHAT_SESSIONS.get(data.file_id)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found. Please analyze report first."
        )

    try:
        answer = llm.answer_question(
            question=data.question,
            report_summary=session["analysis"],
            explanations=session["nlp_explanation"],
            recommendations=session.get("recommendations", {}),
            gender=session.get("gender")
        )

        return ChatResponse(answer=answer)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLM response failed: {str(e)}"
        )