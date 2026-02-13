from app.services.llm_chat import PatientChatLLM

llm = PatientChatLLM()

fake_report = [
    {
        "parameter_key": "hemoglobin",
        "value": 9.8,
        "unit": "g/dL",
        "status": "low",
        "severity": "Medium"
    }
]

fake_explanations = [
    "Hemoglobin is 9.8 g/dL, which is low. Possible causes include iron deficiency. This may result in fatigue."
]

answer = llm.answer_question(
    question="can you explanin haemoglobin?",
    report_summary=fake_report,
    explanations=fake_explanations
)

print("\nLLM OUTPUT:\n")
print(answer)
