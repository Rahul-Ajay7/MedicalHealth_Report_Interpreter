import requests
from typing import Dict, Any, List
from app.config import (
    LLM_BASE_URL,
    LLM_CHAT_ENDPOINT,
    LLM_MODEL,
    LLM_TIMEOUT
)

# ─── Questions that could cause patient panic ───────────────────────────────
SENSITIVE_KEYWORDS = [
    "am i dying",
    "will i die",
    "life threatening",
    "is this fatal",
    "will this kill me",
    "how long do i have",
    "will i survive",
    "is this serious",
    "should i be worried",
    "is this dangerous",
    "am i going to be okay",
]

# ─── "What if" style questions about lab values (allowed) ───────────────────
WHAT_IF_KEYWORDS = [
    "what happen if",
    "what happens if",
    "what if",
    "what does it mean if",
    "what does high",
    "what does low",
    "what does elevated",
    "what does decreased",
    "effects of high",
    "effects of low",
    "symptoms of high",
    "symptoms of low",
    "causes of high",
    "causes of low",
    "why would",
    "what are the effects",
    "what are the symptoms",
]

# ─── Deep medical/MBBS questions (blocked) ──────────────────────────────────
# NOTE: Medicine names are allowed, but dosages are not.
BLOCKED_KEYWORDS = [
    "mechanism of action",
    "pathophysiology",
    "pharmacology",
    "pharmacokinetics",
    "treatment protocol",
    "clinical trial",
    "differential diagnosis",
    "surgery for",
    "surgical",
    "medical procedure",
    "dosage",
    "dose of",
    "mg of",
    "how many mg",
    "how much should i take",
]


class PatientChatLLM:
    def __init__(self):
        self.url   = f"{LLM_BASE_URL}{LLM_CHAT_ENDPOINT}"
        self.model = LLM_MODEL

    # ─────────────────────────────────────────────────────────────────────────
    # CLASSIFIERS
    # ─────────────────────────────────────────────────────────────────────────

    def _is_sensitive_question(self, question: str) -> bool:
        q = question.lower()
        return any(k in q for k in SENSITIVE_KEYWORDS)

    def _is_what_if_question(self, question: str) -> bool:
        """
        Detects patient-friendly 'what if X is high/low' style questions.
        Answered as pure educational info — independent of the report values.
        """
        q = question.lower()
        return any(k in q for k in WHAT_IF_KEYWORDS)

    def _is_blocked_question(self, question: str) -> bool:
        """
        Blocks deep MBBS-level questions. Medicine names are allowed,
        but dosages and clinical protocols are not.
        """
        q = question.lower()
        return any(k in q for k in BLOCKED_KEYWORDS)

    def _derive_severity(self, analysis: Dict[str, Any]) -> str:
        if any(v.get("status") == "critical" for v in analysis.values()):
            return "High"
        if any(v.get("status") in ["low", "high"] for v in analysis.values()):
            return "Medium"
        return "Normal"

    # ─────────────────────────────────────────────────────────────────────────
    # MAIN
    # ─────────────────────────────────────────────────────────────────────────

    def answer_question(
        self,
        question: str,
        report_summary: Dict[str, Any],
        explanations: List[str],
        recommendations: Dict[str, Any],
        gender: str | None = None
    ) -> str:

        severity  = self._derive_severity(report_summary)
        sensitive = self._is_sensitive_question(question)
        what_if   = self._is_what_if_question(question)
        blocked   = self._is_blocked_question(question)

        # ── Hard block: out-of-scope MBBS / dosage questions ─────────────────
        if blocked:
            return (
                "I can only answer questions about what your lab values mean "
                "and what happens when they are high or low. "
                "For detailed medical advice, treatment plans, or dosage information, "
                "please consult your doctor."
            )

        # ── Sensitive question: calm response, no LLM ─────────────────────────
        if sensitive:
            return (
                "I understand this might feel worrying, but I'm not able to "
                "predict outcomes or timelines — that's something only your doctor "
                "can assess after a full evaluation. "
                "Lab reports are just one piece of the picture. "
                "Please speak with your doctor, who can give you proper "
                "guidance based on your full health history. 💙"
            )

        # ── System prompt ─────────────────────────────────────────────────────
        system_prompt = (
            "You are a friendly medical lab report assistant for patients.\n"
            "Your job is to explain what lab values mean and what happens "
            "when they are too high or too low — in simple, easy-to-understand language.\n\n"
            "STRICT RULES:\n"
            "- Do NOT diagnose any condition.\n"
            "- You MAY mention medicine names if relevant (e.g. iron supplements, "
            "folic acid) but NEVER mention dosages, amounts, or how much to take.\n"
            "- Do NOT predict death, timelines, or severity of illness.\n"
            "- Do NOT answer pharmacology, pathophysiology, or clinical protocol questions.\n"
            "- ALWAYS encourage the patient to consult their doctor for medical decisions.\n"
            "- Use simple language a non-medical person can understand.\n"
            "- Keep answers concise and calm.\n"
            f"\nThis patient's overall report severity: {severity}.\n"
        )

        # ── What-if / educational question ───────────────────────────────────
        if what_if:
            user_prompt = f"""
Patient gender: {gender}

Patient question:
{question}

Instructions:
- Answer this as a straightforward educational question about lab values.
- IMPORTANT: Answer EXACTLY what is asked — if the patient asks about HIGH haemoglobin,
  explain what HIGH means, even if their report shows it is LOW. Do not redirect them.
- Give simple, calm information: what it means, common causes, and common symptoms.
- You may mention medicine or supplement names (e.g. iron tablets, folic acid) if helpful,
  but do NOT mention any dosage or amount.
- Do NOT refer to their actual report values unless the patient specifically asks.
- End with: "Please discuss this with your doctor for advice specific to you."

Background context (do NOT use to override the answer — only use if directly relevant):
{report_summary}
"""

        # ── Report-specific question ──────────────────────────────────────────
        else:
            user_prompt = f"""
Patient gender: {gender}

Lab Analysis:
{report_summary}

NLP Explanation:
{explanations}

Recommendations:
{recommendations}

Patient question (ABOUT THIS REPORT):
{question}

Instructions:
- Answer based on this specific report.
- Explain any abnormal values clearly in simple language.
- You may mention medicine or supplement names if relevant, but NO dosages.
- Keep tone calm and supportive.
- End with a reminder to consult their doctor.
"""

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            "temperature": 0.25,
        }

        response = requests.post(self.url, json=payload, timeout=LLM_TIMEOUT)
        response.raise_for_status()

        data = response.json()
        return (
            data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "Sorry, I could not generate a response at this time.")
        )