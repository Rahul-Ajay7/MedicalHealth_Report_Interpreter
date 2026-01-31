from nlp import generate_explanation

result = generate_explanation(
    param_key="hemoglobin",
    value=10.5,
    status="low"
)

print(result)
