from typing import Dict, Any, List
from app.utils.normal_ranges import NORMAL_RANGES


def _status_from_value(value: float, r: Dict[str, float]) -> str:
    if value < r["min"]:
        return "low"
    if value > r["max"]:
        return "high"
    return "normal"


def _get_range(normal_range, gender):
    if not normal_range:
        return None

    if "min" in normal_range and "max" in normal_range:
        return normal_range

    if gender in normal_range:
        return normal_range[gender]

    return None


def analyze_parameters(
    parsed_values: Dict[str, Dict[str, Any]],
    gender: str = "male"
) -> List[Dict[str, Any]]:

    results: List[Dict[str, Any]] = []
    gender = gender.lower()

    for param_key, data in parsed_values.items():
        value = data.get("value")
        unit = data.get("unit", "")

        ref = NORMAL_RANGES.get(param_key)

        status = "unknown"
        severity = "Unknown"
        normal_range = None

        if ref:
            unit = unit or ref.get("unit", "")
            normal_range = _get_range(ref.get("normal_range"), gender)

            if normal_range and value is not None:
                status = _status_from_value(float(value), normal_range)
                severity = "Normal" if status == "normal" else "Medium"

        results.append({
            "param_key": param_key,
            "value": value,
            "unit": unit,
            "status": status,
            "severity": severity,
            "normal_range": normal_range
        })

    return results
