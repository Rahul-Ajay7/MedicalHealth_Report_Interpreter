import requests
from typing import List, Dict
from app.config import (
    LLM_BASE_URL,
    LLM_CHAT_ENDPOINT,
    LLM_MODEL,
    LLM_TIMEOUT
)


class PatientChatLLM:
    def __init__(self):
        self.url = f"{LLM_BASE_URL}{LLM_CHAT_ENDPOINT}"
        self.model = LLM_MODEL

    def answer_question(
        self,
        question: str,
        report_summary: List[Dict],
        explanations: List[str]
    ) -> str:

        system_prompt = (
            "You are a medical report assistant.\n"
            "Answer patient questions using ONLY the given report context.\n"
            "DO NOT give diagnosis, treatment, medication, or lifestyle advice.\n"
            "Use simple, reassuring language.\n"
            "If the question cannot be answered from the report, say so clearly."
        )

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
