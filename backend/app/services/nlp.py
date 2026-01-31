# app/services/nlp.py

MEDICAL_DATA = {
    "hemoglobin": {
        "display_name": "Hemoglobin (Hb)",
        "unit": "g/dL",
        "low": {
            "impact": ["Fatigue and weakness"],
            "lifestyle": ["Increase iron-rich foods"],
            "otc_support": {
                "safe_options": ["Iron multivitamin"],
                "note": "Follow label instructions"
            },
            "prescription_required": {
                "instruction": "Consult a doctor for prescription therapy."
            }
        }
    }
}

def generate_explanation(param_key: str, value: float, status: str):
    info = MEDICAL_DATA.get(param_key)
    if not info:
        return "No medical data available."

    condition = info.get(status)
    if not condition:
        return "Value is within normal range."

    explanation = []
    explanation.append(
        f"Your {info['display_name']} is {value} {info['unit']}, which is considered {status}."
    )

    if "impact" in condition:
        explanation.append("This may lead to " + ", ".join(condition["impact"]) + ".")

    if "lifestyle" in condition:
        explanation.append("Lifestyle advice: " + ", ".join(condition["lifestyle"]) + ".")

    if "otc_support" in condition:
        explanation.append(
            "Over-the-counter options include: "
            + ", ".join(condition["otc_support"]["safe_options"])
            + "."
        )

    if "prescription_required" in condition:
        explanation.append(condition["prescription_required"]["instruction"])

    return " ".join(explanation)
