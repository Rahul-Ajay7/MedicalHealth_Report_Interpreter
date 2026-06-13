import logging
from typing import Dict, Any
from app.utils.normal_ranges import NORMAL_RANGES
from app.services.parser import SANITY

logger = logging.getLogger(__name__)

# How far a lab-printed range may stray from our hardcoded reference before we
# distrust it (guards against OCR-garbled ranges silently mis-flagging values).
_RANGE_RATIO_LO = 0.33
_RANGE_RATIO_HI = 3.0


def _validate_printed_range(printed, hardcoded, param_key) -> bool:
    """
    Decide whether a reference range printed ON the report is trustworthy
    enough to use instead of our hardcoded one.

    Lab-specific ranges are MORE accurate when correct (analyzer, method and
    population differ per lab) — but a misread range is dangerous (could flag
    a critical value as normal). So we accept the printed range only when it
    is well-formed, inside physiological sanity bounds, and reasonably close
    to the hardcoded reference.
    """
    if not printed:
        return False
    pmin, pmax = printed.get("min"), printed.get("max")
    if pmin is None or pmax is None or pmin >= pmax:
        return False

    # Physiological sanity (same bounds the parser uses to reject impossible values)
    if param_key in SANITY:
        lo, hi = SANITY[param_key]
        if not (lo <= pmin and pmax <= hi):
            return False

    # Must be in the same ballpark as the hardcoded reference range
    if hardcoded and "min" in hardcoded and "max" in hardcoded:
        for p, h in ((pmin, hardcoded["min"]), (pmax, hardcoded["max"])):
            if h not in (None, 0):
                ratio = p / h
                if ratio < _RANGE_RATIO_LO or ratio > _RANGE_RATIO_HI:
                    return False

    return True

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
        hardcoded_range = get_gender_range(ref_range, gender)

        # Prefer the lab-printed range when it passes validation, else fall back
        printed = data.get("printed_range")
        if _validate_printed_range(printed, hardcoded_range, param_key):
            normal_range = printed
            range_source = "report"
        else:
            normal_range = hardcoded_range
            range_source = "reference"

        status = get_status(value, normal_range)

        # 🔥 FORCE NORMALIZATION HERE
        status = str(status).lower().strip()

        final_results[param_key] = {
            "value": value,
            "unit": unit,
            "status": status,
            "normal_range": normal_range,
            "range_source": range_source,
        }

    # DEBUG only — analysis values are patient PII, never log at INFO+
    logger.debug("Analyzed %d parameters", len(final_results))
    return final_results