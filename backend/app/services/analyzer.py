import json
from typing import Dict, Any, List, Optional


def load_parameter_config(json_path: str) -> Dict[str, Any]:
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _get_range_for_gender(normal_range: Any, gender: str) -> Optional[Dict[str, float]]:
    """
    normal_range can be:
    - {"male": {"min": 13, "max": 17}, "female": {...}}
    - {"min": 4000, "max": 11000}
    """
    if isinstance(normal_range, dict) and "min" in normal_range and "max" in normal_range:
        return {"min": float(normal_range["min"]), "max": float(normal_range["max"])}

    if isinstance(normal_range, dict) and gender in normal_range:
        g = normal_range[gender]
        if "min" in g and "max" in g:
            return {"min": float(g["min"]), "max": float(g["max"])}

    return None


def _status_from_value(value: float, r: Dict[str, float]) -> str:
    if value < r["min"]:
        return "low"
    if value > r["max"]:
        return "high"
    return "normal"


def analyze_parameters(
    parsed_values: Dict[str, Dict[str, Any]],
    parameter_config: Dict[str, Any],
    gender: str = "male"
) -> List[Dict[str, Any]]:
    """
    Takes parsed values and converts into final output format.
    """
    gender = gender.lower().strip()
    if gender not in ["male", "female"]:
        gender = "male"

    results: List[Dict[str, Any]] = []

    for param_key, data in parsed_values.items():
        if param_key not in parameter_config:
            continue

        config = parameter_config[param_key]
        value = data.get("value")
        unit = data.get("unit") or config.get("unit", "")

        if value is None:
            continue

        normal_range = config.get("normal_range")
        r = _get_range_for_gender(normal_range, gender)

        status = "unknown"
        severity = "Unknown"

        if r:
            status = _status_from_value(float(value), r)

            # severity from json severity_rules
            sev_rules = config.get("severity_rules", {})
            if status in sev_rules:
                severity = sev_rules[status].get("severity", "Unknown")
            else:
                severity = "Normal" if status == "normal" else "Unknown"

        results.append({
            "parameter_key": param_key,
            "display_name": config.get("display_name", param_key),
            "value": float(value),
            "unit": unit,
            "status": status,
            "severity": severity,
            "gender": gender
        })

    return results
