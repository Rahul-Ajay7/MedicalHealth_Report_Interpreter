"""
chat.py  —  upgraded chat route with conversation history
==========================================================
Drop-in replacement for backend/app/routes/chat.py

Changes vs original:
  - Passes conversation history from CHAT_SESSIONS to LLM
  - Saves each user+assistant turn back to session
  - History capped at MAX_HISTORY_TURNS * 2 messages
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import logging

from fastapi import Request

from app.dependencies import verify_token
from app.services.audit import audit, client_ip
from app.services.llm_chat import PatientChatLLM
from app.state.chat_sessions import get_session, set_session
from app.config import LLM_BASE_URL, LLM_CHAT_ENDPOINT, LLM_MODEL, LLM_TIMEOUT

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

MAX_HISTORY_TURNS = 10   # keep last N full turns (user + assistant)

llm = PatientChatLLM(
    base_url      = LLM_BASE_URL,
    chat_endpoint = LLM_CHAT_ENDPOINT,
    model         = LLM_MODEL,
    timeout       = LLM_TIMEOUT,
)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    file_id:  str
    question: str


class ChatResponse(BaseModel):
    answer:        str
    flagged:       bool
    question_type: str
    response_time: float
    llm_source:    str


# ─── Chat Route ───────────────────────────────────────────────────────────────

@router.post("/", response_model=ChatResponse)
async def chat_with_llm(data: ChatRequest, request: Request, user=Depends(verify_token)):
    """
    Ask a question about an analyzed report.
    Maintains conversation history across turns within the same session.

    Auth: requires a valid Supabase JWT; the session must belong to the
    authenticated user (ownership enforced via user_id stored at analyze time).

    LLM chain: Groq → Gemini → Ollama
    """
    session = get_session(data.file_id)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found. Please analyze your report first.",
        )

    # ── Ownership check — never serve another user's report data ──────────────
    if session.get("user_id") != user["sub"]:
        audit("authz_denied", user_id=user["sub"], report_id=data.file_id,
              ip=client_ip(request), status="forbidden", route="chat")
        raise HTTPException(status_code=403, detail="Not authorized for this report.")

    audit("chat_query", user_id=user["sub"], report_id=data.file_id, ip=client_ip(request))

    # ── Get existing history (or init) ────────────────────────────────────────
    if "chat_history" not in session:
        session["chat_history"] = []

    history: list = session["chat_history"]

    try:
        result = llm.answer_question(
            question        = data.question,
            report_summary  = session.get("analysis", {}),
            explanations    = session.get("nlp_explanation", []),
            recommendations = session.get("recommendations", {}),
            gender          = session.get("gender"),
            patient_age     = session.get("age"),
            language        = session.get("language"),
            history         = history,         # ← NEW: pass history
        )

        full_answer = result.answer + result.disclaimer

        # ── Save turn to history ──────────────────────────────────────────────
        # Don't save small talk / blocked / sensitive to history —
        # they're not meaningful context for future questions
        from app.services.llm_chat import QuestionType
        if result.question_type not in (
            QuestionType.BLOCKED,
            QuestionType.SENSITIVE,
            QuestionType.GENERAL_HEALTH,
        ):
            history.append({"role": "user",      "content": data.question})
            history.append({"role": "assistant",  "content": full_answer})

            # Trim to cap
            max_msgs = MAX_HISTORY_TURNS * 2
            session["chat_history"] = history[-max_msgs:]

            # Persist back to the store (required for the Redis backend —
            # get_session returns a copy there, so in-place edits are lost)
            set_session(data.file_id, session)

        logger.info(
            f"Chat response | file_id={data.file_id} "
            f"type={result.question_type.value} "
            f"source={result.llm_source} "
            f"flagged={result.flagged} "
            f"time={result.response_time:.2f}s "
            f"history_turns={len(session['chat_history'])//2}"
        )

        return ChatResponse(
            answer        = full_answer,
            flagged       = result.flagged,
            question_type = result.question_type.value,
            response_time = result.response_time,
            llm_source    = result.llm_source,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat route error | file_id={data.file_id} | error={str(e)}")
        raise HTTPException(
            status_code=500,
            detail="LLM response failed. Please try again in a moment.",
        )