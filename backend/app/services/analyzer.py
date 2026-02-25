from typing import Dict, Any
from app.utils.normal_ranges import NORMAL_RANGES   # 🔥 import from here


# -------- STATUS CHECK ----------
def get_status(value, normal_range):

    if value is None or not normal_range:
        return "unknown"

    # expected = negative cases (urine protein etc)
    if "expected" in normal_range:
        expected = normal_range.get("expected")
        if str(value).lower() == expected:
            return "normal"
        return "abnormal"

    min_val = normal_range.get("min")
    max_val = normal_range.get("max")

    if min_val is not None and value < min_val:
        return "low"

    if max_val is not None and value > max_val:
        return "high"

    return "normal"


# -------- GENDER RANGE ----------
def get_gender_range(ref_range, gender):

    if not ref_range:
        return None

    # if male/female specific
    if "male" in ref_range or "female" in ref_range:
        return ref_range.get(gender.lower())

    return ref_range


# -------- MAIN ANALYSER ----------
# -------- MAIN ANALYSER ----------
def analyze_parameters(parsed_values: Dict[str, Dict[str, Any]], gender="male") -> Dict[str, Any]:

    final_results = {}
    gender = gender.lower()

    for param_key, data in parsed_values.items():

        value = data.get("value")
        unit = data.get("unit", "")

        ref_data = NORMAL_RANGES.get(param_key)
        if not ref_data:
            continue

        ref_unit = ref_data.get("unit", "")
        if not unit:
            unit = ref_unit

        ref_range = ref_data.get("normal_range")
        normal_range = get_gender_range(ref_range, gender)

        status = get_status(value, normal_range)

        # 🔥 FORCE NORMALIZATION HERE
        status = str(status).lower().strip()

        final_results[param_key] = {
            "value": value,
            "unit": unit,
            "status": status,
            "normal_range": normal_range
        }

    print("\nFINAL ANALYSIS:", final_results)
    return final_results