# app/services/nlp.py

from typing import Dict


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

    status = analysis_result.get("status")
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
