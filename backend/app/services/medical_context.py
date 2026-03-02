import json
import os

JSON_PATH = os.path.join(
    os.path.dirname(__file__),
    "medical_knowledge.json"
)

with open(JSON_PATH, "r", encoding="utf-8") as f:
    MEDICAL_KNOWLEDGE = json.load(f)