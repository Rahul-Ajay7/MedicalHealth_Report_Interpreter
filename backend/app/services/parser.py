import re
from typing import Dict, Any


# Aliases mapping (common lab report variations)
PARAM_ALIASES = {
    "hemoglobin": [r"\bhemoglobin\b", r"\bhb\b", r"\bh\.b\b"],
    "rbc_count": [r"\brbc\b", r"\bred blood cell\b", r"\brbc count\b"],
    "wbc_count": [r"\bwbc\b", r"\bwhite blood cell\b", r"\bwbc count\b"],
    "platelet_count": [r"\bplatelet\b", r"\bplatelets\b", r"\bplt\b"],
    "blood_glucose_fasting": [r"\bfasting glucose\b", r"\bfbs\b", r"\bglucose fasting\b"],
    "serum_creatinine": [r"\bcreatinine\b", r"\bserum creatinine\b"],
    "urine_ph": [r"\burine ph\b", r"\bph\b"],
    "urine_protein": [r"\burine protein\b", r"\bprotein\b"],
    "urine_glucose": [r"\burine glucose\b", r"\bglucose\b"],
    "urine_specific_gravity": [r"\bspecific gravity\b", r"\burine specific gravity\b", r"\bsp\.gr\b"],
}


def _clean_text(text: str) -> str:
    text = text.replace("\t", " ")
    text = re.sub(r"[ ]{2,}", " ", text)
    return text


def _extract_numeric_value(line: str):
    """
    Extract first numeric value (supports decimals).
    Example: "Hb 10.8 g/dL" -> 10.8
    """
    m = re.search(r"(-?\d+(?:\.\d+)?)", line)
    if not m:
        return None
    return float(m.group(1))


def _extract_unit(line: str) -> str:
    """
    Extract unit roughly after value.
    Example: "10.8 g/dL" -> "g/dL"
    """
    m = re.search(r"(-?\d+(?:\.\d+)?)[ ]*([a-zA-Z/%µ\^\-\d]+)", line)
    if not m:
        return ""
    return m.group(2).strip()


def parse_report_text(raw_text: str) -> Dict[str, Dict[str, Any]]:
    """
    Converts OCR text into structured lab parameters.
    Output format:
    {
      "hemoglobin": {"value": 10.8, "unit": "g/dL"},
      ...
    }
    """
    raw_text = _clean_text(raw_text)
    lines = [ln.strip() for ln in raw_text.split("\n") if ln.strip()]

    extracted: Dict[str, Dict[str, Any]] = {}

    for line in lines:
        lower_line = line.lower()

        for param_key, patterns in PARAM_ALIASES.items():
            if param_key in extracted:
                continue

            for pat in patterns:
                if re.search(pat, lower_line):
                    val = _extract_numeric_value(line)
                    if val is None:
                        continue

                    unit = _extract_unit(line)

                    extracted[param_key] = {
                        "value": val,
                        "unit": unit
                    }
                    break

    return extracted
