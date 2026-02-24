import requests
from typing import List, Dict
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

    def _is_sensitive_question(self, question: str) -> bool:
        q = question.lower()
        return any(k in q for k in SENSITIVE_KEYWORDS)

    def _max_severity(self, report_summary: List[Dict]) -> str:
        priority = {"Normal": 0, "Medium": 1, "High": 2, "Critical": 3}
        max_level = 0

        for r in report_summary:
            sev = r.get("severity", "Normal")
            max_level = max(max_level, priority.get(sev, 0))

        for k, v in priority.items():
            if v == max_level:
                return k

        return "Normal"

    def answer_question(
        self,
        question: str,
        report_summary: List[Dict],
        explanations: List[str]
    ) -> str:

        severity = self._max_severity(report_summary)
        sensitive = self._is_sensitive_question(question)

        # ---------------- SYSTEM PROMPT ----------------
        system_prompt = (
            "You are a medical report assistant.\n"
            "Answer questions using the provided report context.\n"
            "Do NOT provide diagnosis, dosage, or treatment plans.\n"
            "Use calm, simple, and reassuring language.\n"
            "You may mention medicine names WITHOUT dosage if relevant.\n"
            "Never predict death, survival, or timelines.\n"
        )

        # ---------------- HARD GUARDRAILS ----------------
        if sensitive and severity == "Medium":
            system_prompt += (
                "\nIMPORTANT RULES:\n"
                "- The report findings are NOT life-threatening.\n"
                "- Do NOT mention doctors, hospitals, or emergency care.\n"
                "- Reassure using report facts only.\n"
            )

        if sensitive and severity in ["High", "Critical"]:
            system_prompt += (
                "\nIMPORTANT RULES:\n"
                "- Some findings are serious.\n"
                "- You may suggest medical evaluation carefully.\n"
                "- Do NOT create fear or predict outcomes.\n"
            )

        # ---------------- USER PROMPT ----------------
        user_prompt = f"""
Report summary:
{report_summary}

Generated explanations:
{explanations}

Patient question:
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
