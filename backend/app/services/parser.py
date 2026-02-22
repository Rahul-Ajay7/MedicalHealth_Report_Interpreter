import re
from typing import Dict, Any

# -------- PARAMETER ALIASES ----------
PARAM_ALIASES = {
    "hemoglobin": ["hemoglobin", "haemoglobin", "hb"],
    "wbc_count": ["total leukocyte", "total leucocyte", "wbc", "tlc","total leukocyte count"],
    "rbc_count": ["rbc"],
    "platelet_count": ["platelet"],
    "hematocrit": ["hematocrit", "hct", "pcv"],
    "mcv": ["mcv"],
    "mch": ["mch"],
    "mchc": ["mchc"],

    "neutrophils": ["neutrophils"],
    "lymphocytes": ["lymphocytes"],
    "monocytes": ["monocytes"],
    "eosinophils": ["eosinophils"],
    "basophils": ["basophils"]
}


# -------- CLEAN TEXT ----------
def clean_text(text: str):
    text = text.lower()
    text = text.replace("\t", " ")
    text = re.sub(r"[ ]{2,}", " ", text)
    return text


# -------- EXTRACT NUMBER ----------
def extract_number(text):
    text = text.replace(",", "")
    m = re.search(r"(-?\d+(?:\.\d+)?)", text)
    if m:
        return float(m.group(1))
    return None


# -------- EXTRACT UNIT ----------
def extract_unit(text):
    m = re.search(r"\d+(?:\.\d+)?\s*([a-zA-Z/%]+)", text)
    if m:
        return m.group(1).lower()
    return ""


# -------- MAIN PARSER ----------
def parse_report_text(raw_text: str) -> Dict[str, Dict[str, Any]]:

    text = clean_text(raw_text)
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    parsed = {}

    for i, line in enumerate(lines):

        for param_key, aliases in PARAM_ALIASES.items():

            if param_key in parsed:
                continue

            if any(alias in line for alias in aliases):

                # 🔥 search same line
                value = extract_number(line)
                unit = extract_unit(line)

                # 🔥 if not found, search next 3 lines
                if value is None:
                    for j in range(1,4):
                        if i+j < len(lines):
                            value = extract_number(lines[i+j])
                            unit = extract_unit(lines[i+j])
                            if value is not None:
                                break

                if value is not None:
                    parsed[param_key] = {
                        "value": value,
                        "unit": unit
                    }

    print("\n✅ PARSED VALUES:", parsed)
    return parsed
