# app/services/nlp.py

from typing import Dict, List


def _pretty_name(param_key: str, medical_data: Dict) -> str:
    info = medical_data.get(param_key) or {}
    return info.get("display_name") or param_key.replace("_", " ").title()


def generate_explanation(
    analysis_result: Dict,
    medical_data: Dict
) -> str:
    """
    Generates a plain-language explanation (cause + consequence) for abnormal
    lab values. Critical/panic values ALWAYS get a line — including a strong
    urgent-care prompt — even if the value is in range or has no knowledge
    entry, so a flagged value is never shown without context.
    """

    status   = str(analysis_result.get("status", "")).lower()
    critical = bool(analysis_result.get("critical"))

    # Nothing to say for an in-range, non-critical value
    if status == "normal" and not critical:
        return ""

    param_key = analysis_result.get("param_key")
    value     = analysis_result.get("value")
    unit      = analysis_result.get("unit")
    name      = _pretty_name(param_key, medical_data)

    info      = medical_data.get(param_key)
    condition = info.get(status) if info else None

    parts: List[str] = []

    if condition:
        parts.append(f"{name} is {value} {unit}, which is {status}.")
        if "causes" in condition:
            parts.append("Possible causes include " + ", ".join(condition["causes"]) + ".")
        if "impact" in condition:
            parts.append("This may result in " + ", ".join(condition["impact"]) + ".")
    else:
        # No knowledge entry (or status normal but critical) — still describe it
        verdict = status if status in ("low", "high", "abnormal") else "outside the usual range"
        parts.append(f"{name} is {value} {unit}, which is {verdict}.")

    # Critical values: prepend an unmissable urgent-care prompt
    if critical:
        parts.insert(
            0,
            f"⚠️ {name} is at a level that may need URGENT attention. "
            "Please contact a doctor promptly — if you feel unwell, seek urgent "
            "care now (in India, dial 112 or 108). This is not a diagnosis.",
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

    critical_lines: List[str] = []
    other_lines: List[str] = []

    for param_key, data in analysis_results.items():

        analysis_result = {
            "param_key": param_key,
            "value": data.get("value"),
            "unit": data.get("unit"),
            "status": data.get("status"),
            "critical": data.get("critical"),
        }

        explanation = generate_explanation(
            analysis_result=analysis_result,
            medical_data=medical_data
        )

        if explanation:
            if data.get("critical"):
                critical_lines.append(explanation)
            else:
                other_lines.append(explanation)

    # Surface critical/urgent items first
    return critical_lines + other_lines