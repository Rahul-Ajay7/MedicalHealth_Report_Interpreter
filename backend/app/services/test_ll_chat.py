from app.services.llm_chat import PatientChatLLM

llm = PatientChatLLM()

fake_report = [
    {
        "parameter_key": "hemoglobin",
        "value": 9.8,
        "unit": "g/dL",
        "status": "low",
        "severity": "Medium"
    },
    {
        "parameter_key": "wbc_count",
        "value": 12.3,
        "unit": "×10³/µL",
        "status": "high",
        "severity": "Medium"
    },
    {
        "parameter_key": "fasting_glucose",
        "value": 128,
        "unit": "mg/dL",
        "status": "high",
        "severity": "Medium"
    }
]

fake_explanations = [
    (
        "Hemoglobin is 9.8 g/dL, which is lower than the typical reference range. "
        "Hemoglobin is responsible for carrying oxygen throughout the body. "
        "Lower levels may reduce oxygen delivery to tissues. "
        "Possible contributing factors include iron deficiency, nutritional imbalance, "
        "or gradual blood loss. "
        "This may be associated with fatigue, weakness, or reduced physical endurance."
    ),
    (
        "The white blood cell (WBC) count is 12.3 ×10³/µL, which is above the usual range. "
        "White blood cells are part of the immune system and help the body respond to infections "
        "or inflammation. "
        "An elevated count can sometimes be seen during infections, stress, or inflammatory processes. "
        "In some cases, temporary elevations may occur without noticeable symptoms."
    ),
    (
        "Fasting blood glucose is measured at 128 mg/dL, which is higher than the standard fasting range. "
        "Glucose is the primary source of energy for the body, and its level is regulated by hormones such as insulin. "
        "Higher fasting glucose levels may indicate altered glucose regulation. "
        "Some individuals may not experience symptoms, while others may notice increased thirst or fatigue."
    )
]

answer = llm.answer_question(
    question="What happen during high wbc count and suggest medicine?",
    report_summary=fake_report,
    explanations=fake_explanations
)

print("\nLLM OUTPUT:\n")
print(answer)
