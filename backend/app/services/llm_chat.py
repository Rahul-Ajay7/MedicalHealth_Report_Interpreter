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


class PatientChatLLM:
    def __init__(self):
        self.url = f"{LLM_BASE_URL}{LLM_CHAT_ENDPOINT}"
        self.model = LLM_MODEL

    # ---------------- SAFETY CHECKS ----------------

    def _is_sensitive_question(self, question: str) -> bool:
        q = question.lower()
        return any(k in q for k in SENSITIVE_KEYWORDS)

    def _derive_severity(self, analysis: Dict[str, Any]) -> str:
        """
        Derive overall severity from lab statuses
        """
        priority = {
            "normal": 0,
            "low": 1,
            "high": 1,
            "critical": 2
        }

        max_level = 0

        for _, data in analysis.items():
            status = data.get("status", "normal").lower()
            max_level = max(max_level, priority.get(status, 0))

        if max_level == 2:
            return "High"
        if max_level == 1:
            return "Medium"
        return "Normal"

    # ---------------- MAIN ENTRY ----------------

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

        # ---------------- SYSTEM PROMPT ----------------
        system_prompt = (
            "You are a medical report assistant.\n"
            "You help patients understand lab reports.\n"
            "Do NOT provide diagnosis, prescriptions, or dosages.\n"
            "Do NOT predict death, survival, or timelines.\n"
            "Use calm, factual, patient-friendly language.\n"
            "Base answers strictly on the provided data.\n"
        )

        # ---------------- HARD GUARDRAILS ----------------
        if sensitive and severity == "Normal":
            system_prompt += (
                "\nIMPORTANT:\n"
                "- Findings are within normal or safe ranges.\n"
                "- Reassure calmly using report values only.\n"
                "- Do NOT suggest urgent care.\n"
            )

        elif sensitive and severity == "Medium":
            system_prompt += (
                "\nIMPORTANT:\n"
                "- Some values are mildly abnormal.\n"
                "- Reassure without minimizing.\n"
                "- Suggest routine medical follow-up only if appropriate.\n"
            )

        elif sensitive and severity == "High":
            system_prompt += (
                "\nIMPORTANT:\n"
                "- Some findings require medical attention.\n"
                "- Recommend consulting a doctor carefully.\n"
                "- Do NOT induce panic or urgency.\n"
            )

        # ---------------- USER PROMPT ----------------
        user_prompt = f"""
Patient gender:
{gender}

Lab Analysis:
{report_summary}

NLP Findings Explanation:
{explanations}

Lifestyle & Medical Recommendations:
{recommendations}

Patient Question:
{question}
"""

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2
        }

        response = requests.post(
            self.url,
            json=payload,
            timeout=LLM_TIMEOUT
        )
        response.raise_for_status()

        return response.json()["choices"][0]["message"]["content"]