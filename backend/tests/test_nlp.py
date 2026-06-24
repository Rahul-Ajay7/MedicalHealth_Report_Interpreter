import json
import os
from app.services.nlp import generate_explanation


BASE_DIR = os.path.dirname(__file__)
JSON_PATH = os.path.join(BASE_DIR, "medical_knowledge.json")

with open(JSON_PATH, "r", encoding="utf-8") as f:
    MEDICAL_DATA = json.load(f)

# ---------- Fake analyzer output ---------
analyzer_results = [
    {
        "param_key": "hemoglobin",
        "value": 10.8,
        "unit": "g/dL",
        "status": "low",
        "severity": "Medium",
        "gender": "male"
    },
    {
        "param_key": "hemoglobin",
        "value": 15.2,
        "unit": "g/dL",
        "status": "normal",
        "severity": "Normal",
        "gender": "male"
    },
    {
        "param_key": "wbc_count",
        "value": 13500,
        "unit": "cells/µL",
        "status": "high",
        "severity": "Medium",
        "gender": "male"
    },
    {
        "param_key": "platelet_count",
        "value": 90000,
        "unit": "cells/µL",
        "status": "low",
        "severity": "Medium",
        "gender": "female"
    }
]


def run_test():
    print("\n========== NLP EXPLANATION TEST ==========\n")

    for result in analyzer_results:
        explanation = generate_explanation(result, MEDICAL_DATA)

        if explanation:
            print(explanation)
            print("-" * 70)
        else:
            print(
                f"{result['param_key']} is normal "
                f"({result['value']} {result['unit']}) — no explanation generated."
            )
            print("-" * 70)


if __name__ == "__main__":
    run_test()
