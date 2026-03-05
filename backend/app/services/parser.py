import re
from app.utils.normal_ranges import NORMAL_RANGES

PARAM_ALIASES: dict[str, list[str]] = {
    "hemoglobin":     ["hemoglobin", "haemoglobin", "hb"],
    "wbc_count":      ["total leukocyte count", "total leucocyte count",
                       "total leukocyte", "total leucocyte", "tlc", "wbc"],
    "rbc_count":      ["total rbc count", "total rbc", "rbc count"],
    "platelet_count": ["platelet count", "platelet"],
    "hematocrit":     ["hematocrit value, hct", "hematocrit value",
                       "haematocrit value, hct", "haematocrit value",
                       "hematocrit", "haematocrit", "packed cell volume", "pcv", "hct"],
    "mcv":            ["mean corpuscular volume, mcv", "mean corpuscular volume", "mcv"],
    "mchc":           ["mean cell haemoglobin con, mchc", "mean cell hemoglobin con, mchc",
                       "mean cell haemoglobin concentration", "mean cell hemoglobin concentration",
                       "mchc"],
    "mch":            ["mean cell haemoglobin, mch", "mean cell hemoglobin, mch",
                       "mean cell haemoglobin", "mean cell hemoglobin", "mch"],
    "neutrophils":    ["neutrophils", "neutrophil", "neut"],
    "lymphocytes":    ["lymphocyte", "lymph"],
    "monocytes":      ["monocytes", "monocyte", "mono"],
    "eosinophils":    ["eosinophils", "eosinophil", "eos"],
    "basophils":      ["basophils", "basophil", "baso"],
    "rdw":            ["red cell distribution width", "rdw-cv", "rdw"],
    "mpv":            ["mean platelet volume", "mpv"],
    "fasting_blood_glucose": ["fasting blood glucose", "fasting blood sugar", "fbs", "fbg"],
    "postprandial_glucose":  ["postprandial glucose", "postprandial blood sugar", "ppbs"],
    "hba1c":                 ["hba1c", "glycated haemoglobin", "glycated hemoglobin", "a1c"],
    "total_cholesterol": ["total cholesterol", "cholesterol total", "cholesterol"],
    "ldl":               ["ldl cholesterol", "ldl-c", "low density lipoprotein", "ldl"],
    "hdl":               ["hdl cholesterol", "hdl-c", "high density lipoprotein", "hdl"],
    "triglycerides":     ["triglycerides", "triglyceride", "tg"],
    "vldl":              ["vldl cholesterol", "very low density lipoprotein", "vldl"],
    "bilirubin_total":      ["bilirubin total", "total bilirubin", "s.bilirubin total"],
    "bilirubin_direct":     ["bilirubin direct", "direct bilirubin", "conjugated bilirubin"],
    "sgpt_alt":             ["sgpt/alt", "sgpt", "alanine aminotransferase"],
    "sgot_ast":             ["sgot/ast", "sgot", "aspartate aminotransferase"],
    "alkaline_phosphatase": ["alkaline phosphatase", "alp"],
    "albumin":              ["serum albumin", "albumin"],
    "total_protein":        ["total protein", "serum total protein"],
    "creatinine":  ["serum creatinine", "creatinine"],
    "blood_urea":  ["blood urea nitrogen", "bun", "urea nitrogen", "blood urea"],
    "uric_acid":   ["serum uric acid", "uric acid"],
    "sodium":      ["serum sodium", "sodium", "na+"],
    "potassium":   ["serum potassium", "potassium", "k+"],
    "chloride":    ["serum chloride", "chloride", "cl-"],
    "tsh": ["thyroid stimulating hormone", "tsh"],
    "t3":  ["triiodothyronine", "t3 total", "t3"],
    "t4":  ["thyroxine", "t4 total", "t4"],
    "urine_ph":               ["urine ph", "urine reaction"],
    "urine_specific_gravity": ["specific gravity", "urine sp. gravity"],
    "urine_rbc":              ["urine rbc", "rbc (urine)"],
    "urine_wbc":              ["urine wbc", "wbc (urine)", "pus cells"],
    "urine_protein":          ["urine protein", "protein (urine)"],
    "urine_glucose":          ["urine glucose", "urine sugar", "glucose (urine)"],
    "urine_ketones":          ["urine ketones", "ketones (urine)", "ketone bodies"],
    "urine_bilirubin":        ["urine bilirubin", "bilirubin (urine)"],
}


# ============================================================
# UNIT CONVERSION TABLE
# (raw_unit_from_report, target_unit_in_normal_ranges) -> multiplier
# converted_value = raw_value * multiplier
# ============================================================
UNIT_CONVERSIONS: dict[tuple, float] = {
    # Platelet: report uses lakhs/cumm, NORMAL_RANGES uses cells/mcL
    ("lakhs/cumm",         "cells/mcl"): 100_000,
    ("lakh/cumm",          "cells/mcl"): 100_000,
    ("lakhs/ul",           "cells/mcl"): 100_000,
    ("lakhs/µl",           "cells/mcl"): 100_000,
    ("10^3/µl",            "cells/mcl"): 1_000,
    ("10^3/ul",            "cells/mcl"): 1_000,
    ("k/µl",               "cells/mcl"): 1_000,
    ("k/ul",               "cells/mcl"): 1_000,
    # WBC: report uses cumm, NORMAL_RANGES uses cells/mcL (same magnitude)
    ("cumm",               "cells/mcl"): 1,
    ("/cumm",              "cells/mcl"): 1,
    ("cells/cumm",         "cells/mcl"): 1,
    # RBC: report uses million/cumm, NORMAL_RANGES uses million cells/mcL
    ("million/cumm",       "million cells/mcl"): 1,
    ("millions/cumm",      "million cells/mcl"): 1,
    ("million cells/cumm", "million cells/mcl"): 1,
    ("10^6/µl",            "million cells/mcl"): 1,
    # Pass-throughs — same unit, normalizes casing differences
    ("g/dl",   "g/dl"):  1,
    ("%",      "%"):     1,
    ("fl",     "fl"):    1,
    ("pg",     "pg"):    1,
    ("mg/dl",  "mg/dl"): 1,
    ("meq/l",  "meq/l"): 1,
    ("mmol/l", "meq/l"): 1,
    ("u/l",    "u/l"):   1,
    ("iu/l",   "u/l"):   1,
    ("miu/l",  "miu/l"): 1,
    ("µiu/ml", "miu/l"): 1,
    ("uiu/ml", "miu/l"): 1,
    ("ng/dl",  "ng/dl"): 1,
    ("µg/dl",  "µg/dl"): 1,
    ("ug/dl",  "µg/dl"): 1,
}


def clean_text(text: str) -> str:
    text = text.lower()
    text = text.replace("\t", " ")
    text = re.sub(r"[ ]{2,}", " ", text)
    return text


def extract_number(text: str) -> float | None:
    text = text.replace(",", "")
    m = re.search(r"(-?\d+(?:\.\d+)?)", text)
    return float(m.group(1)) if m else None


def extract_unit(text: str) -> str:
    """
    Extracts unit from a report line using 3 strategies in order:

    Strategy 1 — pipe-separated table row (pdfplumber output):
        "platelet count | 3.5 | lakhs/cumm | 1.5 - 4.1"
        unit is always the 3rd column (index 2)

    Strategy 2 — unit after number with whitespace (digital/OCR text):
        "platelet count 3.5 lakhs/cumm"
        "hemoglobin 15 g/dl"

    Strategy 3 — unit glued directly to number:
        "84.0fL"  "15g/dl"
    """

    # Strategy 1: pipe-separated — unit is 3rd column
    if "|" in text:
        parts = [p.strip() for p in text.split("|")]
        if len(parts) >= 3:
            unit_candidate = parts[2].strip().lower()
            # valid unit: starts with letter or %, has no range separator "-"
            if unit_candidate and "-" not in unit_candidate and re.match(r"^[a-zA-Z%/]", unit_candidate):
                return unit_candidate

    # Strategy 2: unit separated by whitespace after number
    m = re.search(r"-?\d+(?:\.\d+)?\s+([a-zA-Z%][a-zA-Z0-9%/µ^.]*)", text)
    if m:
        return m.group(1).lower()

    # Strategy 3: unit glued to number
    m2 = re.search(r"-?\d+(?:\.\d+)?([a-zA-Z%][a-zA-Z0-9%/µ^.]*)", text)
    if m2:
        return m2.group(1).lower()

    return ""


def convert_value(value: float, raw_unit: str, target_unit: str) -> tuple[float, bool]:
    """
    Converts value from raw_unit (as in report) to target_unit (NORMAL_RANGES).
    Returns (converted_value, was_converted).

    Matching order:
        1. Skip if units already match
        2. Exact key lookup in UNIT_CONVERSIONS
        3. Fuzzy match — raw unit contains or is contained by a known key
        4. No match — return original value unchanged
    """
    ru = raw_unit.lower().strip()
    tu = target_unit.lower().strip()

    # Already same unit
    if ru == tu or ru == "":
        return value, False

    # Exact match
    if (ru, tu) in UNIT_CONVERSIONS:
        return value * UNIT_CONVERSIONS[(ru, tu)], True

    # Fuzzy match
    for (src, tgt), factor in UNIT_CONVERSIONS.items():
        if tgt == tu and (src in ru or ru in src):
            return value * factor, True

    # No conversion found
    return value, False


def parse_report_text(raw_text: str) -> dict[str, dict[str, any]]:
    """
    Full pipeline:
        1. Clean and split OCR/PDF text into lines
        2. Match each line against PARAM_ALIASES
        3. Extract numeric value and raw unit from the report line
        4. Convert value from report unit to NORMAL_RANGES unit
        5. Return { param_key: { value: float, unit: str } }

    The analyzer receives already-converted values so comparison
    against NORMAL_RANGES min/max is always on the same scale.
    """
    text  = clean_text(raw_text)
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    parsed: dict[str, dict[str, any]] = {}

    for i, line in enumerate(lines):
        for param_key, aliases in PARAM_ALIASES.items():
            if param_key in parsed:
                continue

            # Match longest alias first to avoid false partial matches
            if not any(alias in line for alias in sorted(aliases, key=len, reverse=True)):
                continue

            # Extract value and raw unit from this line
            value    = extract_number(line)
            raw_unit = extract_unit(line)

            # Look ahead up to 3 lines if value not on same line
            if value is None:
                for j in range(1, 4):
                    if i + j < len(lines):
                        value    = extract_number(lines[i + j])
                        raw_unit = extract_unit(lines[i + j])
                        if value is not None:
                            break

            if value is None:
                continue

            # Get target unit from NORMAL_RANGES
            ref_data    = NORMAL_RANGES.get(param_key)
            target_unit = ref_data["unit"] if ref_data else raw_unit

            # Convert: e.g. 3.5 lakhs/cumm → 350000.0 cells/mcL
            converted_value, _ = convert_value(value, raw_unit, target_unit)

            parsed[param_key] = {
                "value": round(converted_value, 4),
                "unit":  target_unit,
            }

    print("\n✅ PARSED VALUES:", parsed)
    return parsed