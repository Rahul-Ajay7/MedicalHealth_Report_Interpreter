medical_data = {
    "hemoglobin": {
        "display_name": "Hemoglobin (Hb)",
        "severity_rules": {
            "low": {"severity": "Medium"},
            "high": {"severity": "Medium"}
        },
        "low": {
            "causes": ["Iron deficiency", "Blood loss"],
            "impact": ["Fatigue and weakness"],
            "lifestyle": ["Increase iron-rich foods"],
            "otc_support": {
                "safe_options": ["Iron multivitamin"]
            },
            "prescription_required": {
                "instruction": "Consult a doctor for prescription therapy."
            }
        },
        "confidence_note": "Educational information only."
    }
}
