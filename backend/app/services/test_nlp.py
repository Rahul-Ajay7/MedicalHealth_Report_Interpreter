from app.services.nlp import generate_explanation

# Fake analyzer output (what analyzer.py returns)
analyzer_results = [
    {
        "param_key": "hemoglobin",
        "display_name": "Hemoglobin (Hb)",
        "value": 10.8,
        "unit": "g/dL",
        "status": "low",
        "severity": "Medium",
        "gender": "male"
    },
    {
        "param_key": "hemoglobin",
        "display_name": "Hemoglobin (Hb)",
        "value": 14.5,
        "unit": "g/dL",
        "status": "normal",
        "severity": "Normal",
        "gender": "male"
    }
]


# Fake medical knowledge (later load from JSON file)
MEDICAL_DATA = {
    "hemoglobin": {
        "display_name": "Hemoglobin (Hb)",
        "unit": "g/dL",
        "low": {
            "causes": [
                "Iron deficiency",
                "Blood loss",
                "Poor nutrition"
            ],
            "impact": [
                "Reduced oxygen delivery",
                "Fatigue and weakness"
            ]
        },
        "high": {
            "causes": [
                "Dehydration",
                "Smoking"
            ],
            "impact": [
                "Increased blood thickness",
                "Higher clot risk"
            ]
        }
    }
}


def run_test():
    print("\n--- NLP TEST OUTPUT ---\n")

    for result in analyzer_results:
        explanation = generate_explanation(result, MEDICAL_DATA)

        if explanation:
            print(explanation)
            print("-" * 60)


if __name__ == "__main__":
    run_test()
