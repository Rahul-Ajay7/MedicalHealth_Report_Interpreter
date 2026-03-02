from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

from app.services.llm_chat import PatientChatLLM
from app.state.chat_sessions import CHAT_SESSIONS
from app.config import LLM_BASE_URL, LLM_CHAT_ENDPOINT, LLM_MODEL, LLM_TIMEOUT

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

llm = PatientChatLLM(
    base_url      = LLM_BASE_URL,
    chat_endpoint = LLM_CHAT_ENDPOINT,
    model         = LLM_MODEL,
    timeout       = LLM_TIMEOUT,
)


# ----------- Schemas -----------

class ChatRequest(BaseModel):
    file_id:  str
    question: str


class ChatResponse(BaseModel):
    answer:        str
    flagged:       bool   # True if emergency / sensitive / blocked
    question_type: str    # "emergency" | "sensitive" | "blocked" | "what_if" | "report_based"
    response_time: float  # seconds — useful for monitoring


# ----------- Chat Route -----------

@router.post("/", response_model=ChatResponse)
async def chat_with_llm(data: ChatRequest):
    session = CHAT_SESSIONS.get(data.file_id)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found. Please analyze your report first."
        )

    try:
        result = llm.answer_question(
            question        = data.question,
            report_summary  = session["analysis"],
            explanations    = session["nlp_explanation"],
            recommendations = session.get("recommendations", {}),
            gender          = session.get("gender"),
            patient_age     = session.get("age"),      # pass age if stored in session
            language        = session.get("language"), # pass language if stored in session
        )

        # Combine answer + disclaimer (disclaimer is empty for emergencies)
        full_answer = result.answer + result.disclaimer

        logger.info(
            f"Chat response | file_id={data.file_id} "
            f"type={result.question_type.value} "
            f"flagged={result.flagged} "
            f"time={result.response_time:.2f}s"
        )

        return ChatResponse(
            answer        = full_answer,
            flagged       = result.flagged,
            question_type = result.question_type.value,
            response_time = result.response_time,
        )

    except HTTPException:
        raise  # re-raise HTTP exceptions as-is

    except Exception as e:
        logger.error(f"Chat route error | file_id={data.file_id} | error={str(e)}")
        raise HTTPException(
            status_code=500,
            detail="LLM response failed. Please try again in a moment."
        )