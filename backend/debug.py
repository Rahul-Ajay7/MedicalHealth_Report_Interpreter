# debug_postcheck.py — replace with this
import re
import requests
import os
import sys
sys.path.insert(0, ".")

from app.config import GROQ_API_KEY, GROQ_MODEL, GROQ_API_URL

system_prompt = "You are a medical assistant. Answer in 3-4 sentences."
user_prompt   = "What is Serum Creatinine?"

response = requests.post(
    GROQ_API_URL,
    json={
        "model":    GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        "temperature": 0.25,
        "max_tokens":  400,
    },
    headers={
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    },
    timeout=30,
)

answer = response.json()["choices"][0]["message"]["content"]
print("RAW ANSWER:")
print(answer)
print()

# Now check what triggers
lower = answer.lower()
dosage_patterns = [
    r"\b\d+\s*mg\b",
    r"\b\d+\s*mcg\b",
    r"\b\d+\s*iu\b",
    r"\bdosage\b",
    r"\bloading dose\b",
    r"\bmaintenance dose\b",
    r"\biv dose\b",
    r"\binjection\b",
    r"\btablet[s]?\b",
    r"\bcapsule[s]?\b",
]

print("POST CHECK RESULTS:")
triggered = False
for p in dosage_patterns:
    if re.search(p, lower):
        print(f"  TRIGGERED BY: '{p}'")
        triggered = True

if not triggered:
    print("  Nothing triggered — answer would pass ✅")