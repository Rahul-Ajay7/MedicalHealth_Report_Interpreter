# app/services/nlp.py

from typing import Dict, List


def generate_explanation(
    analysis_result: Dict,
    medical_data: Dict
) -> str:
    """
    Generates ONLY:
    - cause
    - consequence
    for abnormal lab values.
    """

    status = str(analysis_result.get("status", "")).lower()
    if status == "normal":
        return ""

    param_key = analysis_result.get("param_key")
    value = analysis_result.get("value")
    unit = analysis_result.get("unit")

    info = medical_data.get(param_key)
    if not info:
        return ""

    condition = info.get(status)
    if not condition:
        return ""

    parts = [
        f"{info['display_name']} is {value} {unit}, which is {status}."
    ]

    if "causes" in condition:
        parts.append(
            "Possible causes include "
            + ", ".join(condition["causes"])
            + "."
        )

    if "impact" in condition:
        parts.append(
            "This may result in "
            + ", ".join(condition["impact"])
            + "."
        )

    return " ".join(parts)


def generate_nlp_explanations(
    analysis_results: Dict,
    medical_data: Dict
) -> List[str]:
    """
    Adapter that converts analyzer output
    into per-parameter NLP explanations.
    """

    explanations = []

    for param_key, data in analysis_results.items():

        analysis_result = {
            "param_key": param_key,
            "value": data.get("value"),
            "unit": data.get("unit"),
            "status": data.get("status"),
        }

        explanation = generate_explanation(
            analysis_result=analysis_result,
            medical_data=medical_data
        )

        if explanation:
            explanations.append(explanation)

    return explanations