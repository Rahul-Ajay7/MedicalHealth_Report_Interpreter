import requests
from typing import Dict, Any, List
from app.config import (
    LLM_BASE_URL,
    LLM_CHAT_ENDPOINT,
    LLM_MODEL,
    LLM_TIMEOUT
)

SENSITIVE_KEYWORDS = [
    "am i dying",
    "will i die",
    "life threatening",
    "is this fatal",
    "will this kill me",
    "how long do i have",
    "will i survive"
]

GENERAL_EDU_KEYWORDS = [
    "what happens if",
    "what causes",
    "what is",
    "can you explain",
    "difference between",
    "high",
    "low"
]


class PatientChatLLM:
    def __init__(self):
        self.url = f"{LLM_BASE_URL}{LLM_CHAT_ENDPOINT}"
        self.model = LLM_MODEL

    # ---------------- CLASSIFIERS ----------------

    def _is_sensitive_question(self, question: str) -> bool:
        q = question.lower()
        return any(k in q for k in SENSITIVE_KEYWORDS)

    def _is_general_question(self, question: str) -> bool:
        """
        Detects educational / counterfactual questions
        """
        q = question.lower()
        return any(k in q for k in GENERAL_EDU_KEYWORDS)

    def _derive_severity(self, analysis: Dict[str, Any]) -> str:
        priority = {"normal": 0, "low": 1, "high": 1, "critical": 2}
        return (
            "High" if any(v.get("status") == "critical" for v in analysis.values())
            else "Medium" if any(v.get("status") in ["low", "high"] for v in analysis.values())
            else "Normal"
        )

    # ---------------- MAIN ----------------

    def answer_question(
        self,
        question: str,
        report_summary: Dict[str, Any],
        explanations: List[str],
        recommendations: Dict[str, Any],
        gender: str | None = None
    ) -> str:

        severity = self._derive_severity(report_summary)
        sensitive = self._is_sensitive_question(question)
        general = self._is_general_question(question)

        # ---------------- SYSTEM PROMPT ----------------
        system_prompt = (
            "You are a medical lab report assistant.\n"
            "You explain lab parameters in an educational, non-diagnostic way.\n"
            "You do NOT give diagnoses, prescriptions, or dosages.\n"
            "You do NOT predict death or timelines.\n"
            "If the user asks a general medical question, answer generally.\n"
            "If the question refers to the report, use the report.\n"
            "Always clarify whether you are speaking generally or about this report.\n"
        )

        # ---------------- SAFETY GUARDRAILS ----------------
        if sensitive:
            system_prompt += (
                "\nIMPORTANT:\n"
                "- Use calm reassurance.\n"
                "- Encourage consulting a doctor if appropriate.\n"
                "- Do NOT create fear.\n"
            )

        # ---------------- USER PROMPT ----------------
        if general:
            user_prompt = f"""
Patient gender:
{gender}

Relevant lab context (for reference only):
{report_summary}

Patient question (GENERAL MEDICAL EDUCATION):
{question}

Answer by:
- Explaining BOTH high and low levels if relevant
- Clearly stating this is general information
"""
        else:
            user_prompt = f"""
Patient gender:
{gender}

Lab Analysis:
{report_summary}

NLP Explanation:
{explanations}

Recommendations:
{recommendations}

Patient question (ABOUT THIS REPORT):
{question}
"""

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.25
        }

        response = requests.post(self.url, json=payload, timeout=LLM_TIMEOUT)
        response.raise_for_status()

        return response.json()["choices"][0]["message"]["content"]