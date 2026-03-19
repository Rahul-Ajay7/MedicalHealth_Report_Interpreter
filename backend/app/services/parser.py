"""
parser.py
=========
Production parser for medical lab reports (PDFs and images).

Handles the EXACT formats seen in Sterling Accuris / similar Indian lab reports:
  • Single-row layout:   "Hemoglobin Colorimetric 14.5 g/dL 13.0-16.5"
  • Multi-col block:     "T3 T4 TSH ... Result 1.01 7.84 0.82 Unit ng/mL mg/mL ..."
  • Less-than results:   "Vitamin B12 L CLIA < 148 pg/mL"
  • Range microscopy:    "Pus Cells 1-2"
  • Qualitative:         "Urine Protein Absent" / "Urine Glucose Present (+)"
  • H/L flags:           "WBC Count SF Cube cell analysisH 10570 /cmm"

Unit conversions performed so Analyzer gets values in NORMAL_RANGES units:
  /cmm            → cells/mcL          ×1
  million/cmm     → million cells/mcL  ×1
  ng/mL (T3)      → ng/dL             ×10
  mg/mL (T4 lab)  → µg/dL            ×1  (lab notation error, scale identical)
  microIU/mL      → mIU/L             ×1
  micro g/dL      → µg/dL             ×1
  mmol/L (Na/K/Cl)→ mEq/L            ×1
  micromol/L      → µmol/L            ×1
  mm/1hr          → mm/hr             ×1
  lakhs/cumm      → cells/mcL      ×100000
  10^3/µL         → cells/mcL      ×1000
"""

import re
from app.utils.normal_ranges import NORMAL_RANGES


# ══════════════════════════════════════════════════════════════════════════════
#  PARAM ALIASES
#  Rules: longer/specific phrases FIRST; all lowercase; word-boundary matched
# ══════════════════════════════════════════════════════════════════════════════

PARAM_ALIASES: dict[str, list[str]] = {

    # ── CBC ─────────────────────────────────────────────────────────────────
    "hemoglobin":     ["haemoglobin", "hemoglobin", "hb"],
    "wbc_count":      ["total leukocyte count", "total leucocyte count",
                       "total leukocyte", "total leucocyte",
                       "white blood cell count", "wbc count", "tlc", "wbc"],
    "rbc_count":      ["total rbc count", "rbc count", "rbc"],
    "platelet_count": ["platelet count", "thrombocyte count", "platelet", "plt"],
    "hematocrit":     ["packed cell volume", "haematocrit value", "hematocrit value",
                       "haematocrit", "hematocrit", "pcv", "hct"],
    "mcv":            ["mean corpuscular volume", "mean cell volume", "mcv"],
    "mchc":           ["mean cell haemoglobin concentration",
                       "mean cell hemoglobin concentration",
                       "mean corpuscular hemoglobin concentration", "mchc"],
    "mch":            ["mean cell haemoglobin", "mean cell hemoglobin",
                       "mean corpuscular hemoglobin", "mch"],
    "rdw":            ["red cell distribution width", "rdw cv", "rdw-cv", "rdw-sd", "rdw"],
    "mpv":            ["mean platelet volume", "mpv"],

    # ── DIFFERENTIAL ────────────────────────────────────────────────────────
    "neutrophils":    ["neutrophils", "neutrophil", "polymorphs", "neut"],
    "lymphocytes":    ["lymphocytes", "lymphocyte", "lymph"],
    "monocytes":      ["monocytes", "monocyte", "mono"],
    "eosinophils":    ["eosinophils", "eosinophil", "eos"],
    "basophils":      ["basophils", "basophil", "baso"],

    # ── ESR ─────────────────────────────────────────────────────────────────
    "esr":            ["erythrocyte sedimentation rate", "westergren", "esr"],

    # ── BLOOD SUGAR ─────────────────────────────────────────────────────────
    "fasting_blood_glucose": ["fasting plasma glucose", "fasting blood glucose",
                               "fasting blood sugar", "fasting sugar",
                               "blood glucose fasting", "fbg", "fbs"],
    "postprandial_glucose":  ["postprandial glucose", "post prandial glucose",
                               "postprandial blood sugar", "ppbs", "pp glucose"],
    "random_blood_glucose":  ["random plasma glucose", "random blood glucose",
                               "random blood sugar", "random glucose", "rbs"],
    "hba1c":                 ["glycated haemoglobin", "glycated hemoglobin",
                               "glycosylated hemoglobin", "hemoglobin a1c",
                               "hb a1c", "hba1c"],
    "mean_blood_glucose":    ["mean blood glucose", "average blood glucose",
                               "estimated average glucose", "eag"],

    # ── LIPID ───────────────────────────────────────────────────────────────
    "total_cholesterol": ["total cholesterol", "serum cholesterol",
                           "cholesterol total", "cholesterol"],
    "ldl":               ["direct ldl", "ldl cholesterol",
                           "low density lipoprotein", "ldl-c", "ldl"],
    "hdl":               ["hdl cholesterol", "high density lipoprotein",
                           "hdl-c", "hdl"],
    "triglycerides":     ["serum triglycerides", "triglycerides",
                           "triglyceride", "tg"],
    "vldl":              ["vldl cholesterol", "very low density lipoprotein",
                           "vldl-c", "vldl"],

    # ── LIVER ───────────────────────────────────────────────────────────────
    "total_protein":        ["total protein", "serum total protein"],
    "albumin":              ["serum albumin", "albumin"],
    "globulin":             ["serum globulin", "globulin"],
    "ag_ratio":             ["albumin globulin ratio", "a/g ratio", "ag ratio"],
    "bilirubin_total":      ["total bilirubin", "bilirubin total",
                              "s.bilirubin total"],
    "bilirubin_direct":     ["conjugated bilirubin", "direct bilirubin",
                              "bilirubin direct"],
    "bilirubin_indirect":   ["unconjugated bilirubin", "indirect bilirubin"],
    "sgpt_alt":             ["alanine aminotransferase", "alanine transaminase",
                              "sgpt/alt", "alt/sgpt", "sgpt", "alt"],
    "sgot_ast":             ["aspartate aminotransferase", "aspartate transaminase",
                              "sgot/ast", "ast/sgot", "sgot", "ast"],
    "alkaline_phosphatase": ["alkaline phosphatase", "alk phos", "alkp", "alp"],

    # ── KIDNEY ──────────────────────────────────────────────────────────────
    "creatinine":         ["serum creatinine", "creatinine serum", "creatinine"],
    "blood_urea":         ["serum urea", "blood urea", "urea"],   # "urea" guarded vs BUN in parse loop
    "blood_urea_nitrogen":["blood urea nitrogen", "urea nitrogen", "bun"],
    "uric_acid":          ["serum uric acid", "uric acid"],
    "calcium":            ["serum calcium", "total calcium", "calcium"],

    # ── ELECTROLYTES ────────────────────────────────────────────────────────
    "sodium":    ["serum sodium", "sodium na+", "sodium na", "sodium"],
    "potassium": ["serum potassium", "potassium k+", "potassium k", "potassium"],
    "chloride":  ["serum chloride", "chloride cl-", "chloride cl", "chloride"],

    # ── THYROID (longer first) ───────────────────────────────────────────────
    "tsh":     ["thyroid stimulating hormone", "serum tsh", "tsh"],
    "free_t3": ["free triiodothyronine", "ft3", "free t3"],
    "free_t4": ["free thyroxine", "ft4", "free t4"],
    "t3":      ["triiodothyronine", "t3 - triiodothyronine",
                 "t3 total", "t3"],
    "t4":      ["thyroxine", "t4 - thyroxine",
                 "t4 total", "t4"],

    # ── IRON ────────────────────────────────────────────────────────────────
    "serum_iron":             ["serum iron level", "serum iron", "iron"],
    "tibc":                   ["total iron binding capacity", "tibc"],
    "transferrin_saturation": ["transferrin saturation", "percent saturation"],

    # ── VITAMINS ────────────────────────────────────────────────────────────
    "vitamin_d":  ["25(oh) vitamin d", "25 oh vitamin d", "25-hydroxy vitamin d",
                    "vitamin d total", "vitamin d3", "vit d", "vitamin d"],
    "vitamin_b12":["vitamin b12", "cobalamin", "vit b12"],
    "folate":     ["serum folate", "folic acid", "folate"],

    # ── SPECIAL MARKERS ─────────────────────────────────────────────────────
    "homocysteine":      ["homocysteine serum", "serum homocysteine", "homocysteine"],
    "psa":               ["psa-prostate specific antigen total",
                           "psa prostate specific antigen total",
                           "prostate specific antigen total",
                           "prostate specific antigen", "total psa", "psa"],
    "ige":               ["immunoglobulin e", "total ige", "ige"],
    "crp":               ["c-reactive protein", "c reactive protein",
                           "hs-crp", "hscrp", "crp"],
    "microalbumin_urine":["microalbumin per urine volume", "microalbumin urine",
                           "urine microalbumin", "microalbumin"],

    # ── URINE PHYSICAL ──────────────────────────────────────────────────────
    "urine_ph":               ["reaction of urine", "urine reaction",
                                "ph of urine", "urine ph", "ph"],
    "urine_specific_gravity": ["specific gravity of urine",
                                "urine specific gravity",
                                "urine sp. gravity", "specific gravity", "sp gr"],

    # ── URINE CHEMICAL (qualitative) ────────────────────────────────────────
    "urine_protein":      ["urine albumin", "urine protein", "protein urine"],
    "urine_glucose":      ["urine sugar", "urine glucose", "glucose urine"],
    "urine_ketones":      ["urine ketone bodies", "urine ketones",
                            "ketone bodies", "urine ketone"],
    "urine_bilirubin":    ["urine bilirubin", "bilirubin urine", "bilirubin (urine)", "bilirubin diazo"],
    "urine_urobilinogen": ["urine urobilinogen", "urobilinogen"],
    "urine_nitrite":      ["urine nitrite", "nitrite"],

    # ── URINE MICROSCOPY ────────────────────────────────────────────────────
    "urine_rbc":             ["red blood cells urine", "red cells urine",
                               "red cells", "rbc urine", "urine rbc"],
    "urine_wbc":             ["white blood cells urine", "pus cells urine",
                               "wbc urine", "urine wbc", "pus cells", "pus cell"],
    "urine_epithelial_cells":["epithelial cells urine", "epithelial cells",
                               "squamous cells"],
    "urine_casts":           ["hyaline casts", "granular casts",
                               "urine casts", "casts"],
    "urine_crystals":        ["urine crystals", "crystals"],
}


# ══════════════════════════════════════════════════════════════════════════════
#  PARAM CLASSIFICATION
# ══════════════════════════════════════════════════════════════════════════════

QUALITATIVE_PARAMS = {
    "urine_protein", "urine_glucose", "urine_ketones", "urine_bilirubin",
    "urine_urobilinogen", "urine_nitrite", "urine_crystals",
}

MICROSCOPIC_PARAMS = {
    "urine_rbc", "urine_wbc", "urine_epithelial_cells", "urine_casts",
}

# Differential — accept only % values (0-100), reject absolute counts
PERCENT_ONLY_PARAMS = {
    "neutrophils", "lymphocytes", "monocytes", "eosinophils", "basophils",
}


# ══════════════════════════════════════════════════════════════════════════════
#  QUALITATIVE MAP
# ══════════════════════════════════════════════════════════════════════════════

QUALITATIVE_MAP: dict[str, str] = {
    "negative":  "negative", "neg":      "negative",
    "nil":       "negative", "absent":   "negative",
    "not seen":  "negative", "not found":"negative",
    "normal":    "negative",
    "trace":     "trace",
    "++++":      "+4",       "4+": "+4", "+4": "+4",
    "+++":       "+3",       "3+": "+3", "+3": "+3",
    "++":        "+2",       "2+": "+2", "+2": "+2",
    "+":         "+1",       "1+": "+1", "+1": "+1",
    "present":   "+1",       "positive": "+1",
    "present (+)":"+1",
}


# ══════════════════════════════════════════════════════════════════════════════
#  UNIT CONVERSION TABLE
#  Key: (raw_unit_lowercase, target_unit_lowercase)  →  multiplier
# ══════════════════════════════════════════════════════════════════════════════

UNIT_CONVERSIONS: dict[tuple[str, str], float] = {
    # ── Platelet / WBC absolute ──────────────────────────────────────────────
    ("lakhs/cumm",          "cells/mcl"): 100_000,
    ("lakh/cumm",           "cells/mcl"): 100_000,
    ("lakhs/ul",            "cells/mcl"): 100_000,
    ("lakhs/µl",            "cells/mcl"): 100_000,
    ("/cumm",               "cells/mcl"): 1,
    ("cumm",                "cells/mcl"): 1,
    ("cells/cumm",          "cells/mcl"): 1,
    ("/cmm",                "cells/mcl"): 1,
    ("cells/cmm",           "cells/mcl"): 1,
    ("10^3/µl",             "cells/mcl"): 1_000,
    ("10^3/ul",             "cells/mcl"): 1_000,
    ("k/µl",                "cells/mcl"): 1_000,
    ("k/ul",                "cells/mcl"): 1_000,
    # ── RBC ─────────────────────────────────────────────────────────────────
    ("million/cumm",        "million cells/mcl"): 1,
    ("millions/cumm",       "million cells/mcl"): 1,
    ("million cells/cumm",  "million cells/mcl"): 1,
    ("million/cmm",         "million cells/mcl"): 1,
    ("million cells/cmm",   "million cells/mcl"): 1,
    ("10^6/µl",             "million cells/mcl"): 1,
    # ── Thyroid ─────────────────────────────────────────────────────────────
    # T3: report ng/mL → NORMAL_RANGES ng/dL
    ("ng/ml",               "ng/dl"):   10,
    # TSH: microIU/mL = mIU/L
    ("microiu/ml",          "miu/l"):   1,
    ("µiu/ml",              "miu/l"):   1,
    ("uiu/ml",              "miu/l"):   1,
    # T4: report writes "mg/mL" but value is in µg/dL range (lab notation error)
    # 7.84 mg/mL × 100 = 784 µg/dL (impossible) → treat as µg/dL directly
    # Handled by sanity check + T4-special logic in _convert()
    ("mg/ml",               "µg/dl"):   1,   # intentional ×1 (see note above)
    ("ug/dl",               "µg/dl"):   1,
    # ── Iron ────────────────────────────────────────────────────────────────
    # "micro g/dL" = µg/dL
    ("micro g/dl",          "µg/dl"):   1,
    ("mcg/dl",              "µg/dl"):   1,
    # ── Electrolytes ────────────────────────────────────────────────────────
    # mmol/L = mEq/L for monovalent ions (Na, K, Cl)
    ("mmol/l",              "meq/l"):   1,
    # ── ESR ─────────────────────────────────────────────────────────────────
    ("mm/1hr",              "mm/hr"):   1,
    ("mm/hr",               "mm/hr"):   1,
    # ── Homocysteine ────────────────────────────────────────────────────────
    ("micromol/l",          "µmol/l"):  1,
    ("µmol/l",              "µmol/l"):  1,
}


# ══════════════════════════════════════════════════════════════════════════════
#  DEFAULT UNITS
#  Injected when OCR misses the unit column
# ══════════════════════════════════════════════════════════════════════════════

DEFAULT_UNITS: dict[str, str] = {
    "hemoglobin": "g/dL", "wbc_count": "cells/mcL", "rbc_count": "million cells/mcL",
    "platelet_count": "cells/mcL", "hematocrit": "%", "mcv": "fL",
    "mch": "pg", "mchc": "g/dL", "rdw": "%", "mpv": "fL",
    "neutrophils": "%", "lymphocytes": "%", "monocytes": "%",
    "eosinophils": "%", "basophils": "%",
    "esr": "mm/hr",
    "fasting_blood_glucose": "mg/dL", "postprandial_glucose": "mg/dL",
    "random_blood_glucose": "mg/dL", "hba1c": "%", "mean_blood_glucose": "mg/dL",
    "total_cholesterol": "mg/dL", "ldl": "mg/dL", "hdl": "mg/dL",
    "triglycerides": "mg/dL", "vldl": "mg/dL",
    "total_protein": "g/dL", "albumin": "g/dL", "globulin": "g/dL",
    "ag_ratio": "", "bilirubin_total": "mg/dL", "bilirubin_direct": "mg/dL",
    "bilirubin_indirect": "mg/dL",
    "sgpt_alt": "U/L", "sgot_ast": "U/L", "alkaline_phosphatase": "U/L",
    "creatinine": "mg/dL", "blood_urea": "mg/dL", "blood_urea_nitrogen": "mg/dL",
    "uric_acid": "mg/dL", "calcium": "mg/dL",
    "sodium": "mEq/L", "potassium": "mEq/L", "chloride": "mEq/L",
    "tsh": "mIU/L", "t3": "ng/dL", "t4": "µg/dL",
    "free_t3": "pg/mL", "free_t4": "ng/dL",
    "serum_iron": "µg/dL", "tibc": "µg/dL", "transferrin_saturation": "%",
    "vitamin_d": "ng/mL", "vitamin_b12": "pg/mL", "folate": "ng/mL",
    "homocysteine": "µmol/L", "psa": "ng/mL", "ige": "IU/mL",
    "crp": "mg/L", "microalbumin_urine": "mg/L",
    "urine_ph": "", "urine_specific_gravity": "",
    "urine_rbc": "cells/hpf", "urine_wbc": "cells/hpf",
    "urine_epithelial_cells": "cells/hpf", "urine_casts": "/lpf",
}

# ══════════════════════════════════════════════════════════════════════════════
#  SANITY RANGES  — rejects physiologically impossible extracted values
# ══════════════════════════════════════════════════════════════════════════════

SANITY: dict[str, tuple[float, float]] = {
    "hemoglobin": (3, 25), "wbc_count": (500, 100_000),
    "rbc_count": (1, 10), "platelet_count": (5_000, 2_000_000),
    "hematocrit": (10, 70), "mcv": (50, 130), "mch": (10, 50),
    "mchc": (20, 45), "rdw": (5, 30), "mpv": (3, 25),
    "neutrophils": (0, 100), "lymphocytes": (0, 100),
    "monocytes": (0, 30), "eosinophils": (0, 30), "basophils": (0, 10),
    "esr": (0, 150),
    "fasting_blood_glucose": (30, 800), "postprandial_glucose": (30, 1000),
    "random_blood_glucose": (30, 1000), "hba1c": (3, 20),
    "mean_blood_glucose": (30, 1000),
    "total_cholesterol": (50, 500), "ldl": (10, 400),
    "hdl": (10, 150), "triglycerides": (20, 2000), "vldl": (1, 200),
    "total_protein": (2, 12), "albumin": (1, 7),
    "globulin": (0.5, 8), "ag_ratio": (0.3, 5),
    "bilirubin_total": (0.1, 30), "bilirubin_direct": (0, 15),
    "bilirubin_indirect": (0, 20),
    "sgpt_alt": (1, 3000), "sgot_ast": (1, 3000),
    "alkaline_phosphatase": (10, 1500),
    "creatinine": (0.2, 20), "blood_urea": (2, 300),
    "blood_urea_nitrogen": (2, 150),
    "uric_acid": (1, 20), "calcium": (5, 15),
    "sodium": (100, 180), "potassium": (1, 10), "chloride": (70, 130),
    "tsh": (0, 100), "t3": (0.5, 500), "t4": (0.5, 50),
    "free_t3": (0.5, 20), "free_t4": (0.1, 10),
    "serum_iron": (5, 500), "tibc": (100, 600),
    "transferrin_saturation": (1, 100),
    "vitamin_d": (1, 200), "vitamin_b12": (10, 5000),
    "homocysteine": (1, 200), "psa": (0, 500),
    "ige": (0, 50000), "crp": (0, 500),
    "microalbumin_urine": (0, 5000),
    "urine_ph": (4, 9), "urine_specific_gravity": (1.0, 1.04),
    "urine_rbc": (0, 200), "urine_wbc": (0, 200),
}

# Noise words to ignore when extracting units from multi-column blocks
UNIT_NOISE = {
    "biological", "ref", "interval", "calculated", "method", "chromophores",
    "binding", "mordant", "cationic", "azobilirubin", "bromocresol", "green",
    "chemiluminescence", "immunoturbidimetric", "high", "performance", "liquid",
    "chromatography", "explanation", "screening", "diabetes", "pre", "non",
    "bilirubin", "delta", "unconjugated", "years", "male", "female",
    "mean", "blood", "glucose", "b", "h", "l", "for", "colorimetric",
    "electrical", "impedance", "derived", "microscopic", "capillary",
    "photometry", "ezymatic", "peroxidase", "oxidase", "pta", "mgcl2",
    "god", "pod", "direct", "measured", "god-pod", "copper", "tartrate",
    "dye", "mordant", "nitroprusside", "urease", "arsenazo", "uricase",
    "pyridyl", "azo", "clia", "ise", "ifcc",
}


# ══════════════════════════════════════════════════════════════════════════════
#  UTILITY FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

def clean_text(text: str) -> str:
    text = text.lower()
    text = text.replace("\t", " ")
    text = re.sub(r"[ ]{2,}", " ", text)
    return text


def _alias_match(line: str, aliases: list[str]) -> bool:
    """Word-boundary safe alias matching — prevents 'hb' matching 'hba1c'."""
    for alias in sorted(aliases, key=len, reverse=True):
        pat = r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])"
        if re.search(pat, line):
            return True
    return False


def _extract_number(text: str, after_pos: int = 0) -> float | None:
    """
    Extract the primary numeric value from text.
    after_pos: character position to start searching (skip param name prefix).
    Handles:
      • "< 148"         → 148
      • "H 10570 /cmm"  → 10570  (H/L flags stripped)
      • "25(OH) Vitamin D CLIA 8.98 ng/mL" with after_pos=alias_end → 8.98
    """
    t = text[after_pos:].replace(",", "")
    t = re.sub(r"\b[HL]\b\s*", " ", t)
    t = re.sub(r"[<>]\s*", "", t)
    t = re.sub(r"x?\s*10\s*[\^*]\s*\d+", "", t, flags=re.IGNORECASE)
    m = re.search(r"(?<![a-z])(-?\d+(?:\.\d+)?)(?![a-z])", t)
    return float(m.group(1)) if m else None


def _extract_unit(text: str) -> str:
    """
    Extract unit string from a single-row line.
    Strategies (in order):
      1. Pipe-separated table: unit is 3rd column
      2. Unit after number with whitespace
      3. Unit glued to number
    """
    # Strategy 1: pipe-separated
    if "|" in text:
        parts = [p.strip() for p in text.split("|")]
        if len(parts) >= 3:
            cand = parts[2].strip().lower()
            if cand and "-" not in cand and re.match(r"^[a-zA-Z%/µ]", cand):
                return cand

    # Strategy 2: whitespace-separated (handles "10570 /cmm", "14.5 g/dL")
    m = re.search(r"-?\d+(?:\.\d+)?\s+([a-zA-Z%µ/][a-zA-Z0-9%/µ^.\s]*?)(?:\s+\d|\s*$)", text)
    if m:
        return m.group(1).strip().lower()

    # Strategy 3: glued ("84.0fL")
    m2 = re.search(r"-?\d+(?:\.\d+)?([a-zA-Z%µ][a-zA-Z0-9%/µ^.]*)", text)
    if m2:
        return m2.group(1).lower()

    return ""


def _extract_qualitative(text: str) -> str | None:
    """Return normalised qualitative token, longest match wins."""
    t = text.lower().strip()
    for key in sorted(QUALITATIVE_MAP, key=len, reverse=True):
        if key in t:
            return QUALITATIVE_MAP[key]
    return None


def _extract_range_max(text: str) -> float | None:
    """
    Microscopic ranges:
      "1-2" → 2.0    "3-5 /hpf" → 5.0
      "nil" → 0.0    "absent"   → 0.0
    """
    t = text.lower()
    if any(w in t for w in ("nil", "none", "absent", "not seen")):
        return 0.0
    m = re.search(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)", t)
    if m:
        return float(m.group(2))
    return _extract_number(t)


def _convert(value: float, raw_unit: str, target_unit: str) -> float:
    """
    Convert value from report unit to NORMAL_RANGES target unit.
    """
    ru = raw_unit.lower().strip()
    tu = target_unit.lower().strip()

    if not ru or ru == tu:
        return value

    # Special T4 case: lab writes "mg/mL" but means µg/dL (identical numeric value)
    if ru == "mg/ml" and ("µg" in tu or "ug" in tu) and value < 30:
        return value  # already in µg/dL range, no conversion needed

    # Exact match
    if (ru, tu) in UNIT_CONVERSIONS:
        return value * UNIT_CONVERSIONS[(ru, tu)]

    # Fuzzy: raw unit contains known key or vice versa
    for (src, tgt), factor in UNIT_CONVERSIONS.items():
        if tgt == tu and (src in ru or ru in src):
            return value * factor

    return value


def _sanity_ok(param: str, value: float) -> bool:
    if param not in SANITY:
        return True
    lo, hi = SANITY[param]
    return lo <= value <= hi


# ══════════════════════════════════════════════════════════════════════════════
#  SINGLE-ROW PARSER  (Layout A)
# ══════════════════════════════════════════════════════════════════════════════

def _parse_single_row(lines: list[str], idx: int, param_key: str) -> dict | None:
    line = lines[idx]

    # ── Qualitative ─────────────────────────────────────────────────────────
    if param_key in QUALITATIVE_PARAMS:
        for sl in [line] + [lines[idx + j] for j in range(1, 4)
                             if idx + j < len(lines)]:
            q = _extract_qualitative(sl)
            if q:
                return {"value": q, "unit": ""}
        return None

    # ── Microscopic ─────────────────────────────────────────────────────────
    if param_key in MICROSCOPIC_PARAMS:
        for sl in [line] + [lines[idx + j] for j in range(1, 4)
                             if idx + j < len(lines)]:
            v = _extract_range_max(sl)
            if v is not None:
                return {
                    "value": v,
                    "unit": NORMAL_RANGES.get(param_key, {}).get("unit", "cells/hpf")
                }
        return None

    # ── Numeric ─────────────────────────────────────────────────────────────
    # Find alias end position so we skip numbers embedded in param name (e.g. "25(OH)")
    alias_end = 0
    for alias in sorted(PARAM_ALIASES.get(param_key, []), key=len, reverse=True):
        pat = r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])"
        m_alias = re.search(pat, line)
        if m_alias:
            alias_end = m_alias.end()
            break

    value    = _extract_number(line, after_pos=alias_end)
    raw_unit = _extract_unit(line[alias_end:]) if alias_end else _extract_unit(line)

    # Look ahead up to 3 lines if value not found on label line
    if value is None:
        for j in range(1, 4):
            if idx + j < len(lines):
                nxt = lines[idx + j]
                if not re.search(r"\d", nxt):
                    break           # text-only line → stop
                v = _extract_number(nxt)
                if v is not None:
                    value    = v
                    raw_unit = _extract_unit(nxt)
                    break

    if value is None:
        return None

    ref_data    = NORMAL_RANGES.get(param_key, {})
    target_unit = ref_data.get("unit", raw_unit)
    converted   = _convert(value, raw_unit, target_unit)

    if not _sanity_ok(param_key, converted):
        return None

    # Inject default unit if OCR missed it
    if not target_unit and param_key in DEFAULT_UNITS:
        target_unit = DEFAULT_UNITS[param_key]

    return {"value": round(converted, 4), "unit": target_unit}


# ══════════════════════════════════════════════════════════════════════════════
#  MULTI-COLUMN BLOCK PARSER  (Layout B)
#  Detects lines like: "T3 T4 TSH Result 1.01 7.84 0.82 Unit ng/mL mg/mL ..."
# ══════════════════════════════════════════════════════════════════════════════

def _build_ref_entries() -> list[tuple[float, float, str]]:
    """Build fuzzy ref-range lookup from NORMAL_RANGES."""
    entries: list[tuple[float, float, str]] = []
    for pk, data in NORMAL_RANGES.items():
        nr = data.get("normal_range", {})
        if "expected" in nr:
            continue
        if "male" in nr:
            for g in ("male", "female"):
                if g in nr:
                    entries.append((float(nr[g]["min"]), float(nr[g]["max"]), pk))
        elif "min" in nr:
            entries.append((float(nr["min"]), float(nr["max"]), pk))
    return entries

REF_ENTRIES = _build_ref_entries()

# raw_unit → candidate param keys (pre-filter before fuzzy ref match)
UNIT_TO_PARAMS: dict[str, set[str]] = {
    "ng/ml":      {"t3", "free_t3", "vitamin_d", "psa", "vitamin_b12"},
    "mg/ml":      {"t4", "free_t4"},
    "µg/dl":      {"t4", "free_t4", "serum_iron", "tibc"},
    "ug/dl":      {"t4", "free_t4", "serum_iron", "tibc"},
    "ng/dl":      {"t3", "free_t3"},
    "pg/ml":      {"free_t3", "vitamin_b12"},
    "microiu/ml": {"tsh"},
    "µiu/ml":     {"tsh"},
    "miu/l":      {"tsh"},
    "g/dl":       {"hemoglobin", "albumin", "total_protein", "globulin", "mchc"},
    "mg/dl":      {"bilirubin_total", "bilirubin_direct", "bilirubin_indirect",
                   "creatinine", "blood_urea", "blood_urea_nitrogen",
                   "uric_acid", "calcium",
                   "fasting_blood_glucose", "postprandial_glucose",
                   "random_blood_glucose", "mean_blood_glucose",
                   "total_cholesterol", "ldl", "hdl", "triglycerides", "vldl"},
    "u/l":        {"sgpt_alt", "sgot_ast", "alkaline_phosphatase"},
    "meq/l":      {"sodium", "potassium", "chloride"},
    "mmol/l":     {"sodium", "potassium", "chloride"},
    "%":          {"hba1c", "hematocrit", "neutrophils", "lymphocytes",
                   "monocytes", "eosinophils", "basophils", "rdw",
                   "transferrin_saturation"},
    "fl":         {"mcv", "mpv"},
    "pg":         {"mch"},
    "mm/hr":      {"esr"},
    "mm/1hr":     {"esr"},
    "mg/l":       {"crp", "microalbumin_urine"},
    "iu/ml":      {"ige"},
    "ng/ml":      {"vitamin_d", "psa"},
    "µmol/l":     {"homocysteine"},
    "micromol/l": {"homocysteine"},
    "":           {"ag_ratio", "urine_ph", "urine_specific_gravity"},
}


def _fuzzy_ref_match(
    lo: float, hi: float,
    unit_filter: set[str] | None,
    used: set[str],
    tol: float = 0.8,
) -> str | None:
    best_pk, best_diff = None, float("inf")
    for r_lo, r_hi, pk in REF_ENTRIES:
        if pk in used:
            continue
        if unit_filter is not None and pk not in unit_filter:
            continue
        diff = abs(lo - r_lo) + abs(hi - r_hi)
        if diff < best_diff and diff <= tol * 2:
            best_diff, best_pk = diff, pk
    return best_pk


def _parse_multicolumn_line(line: str, already_parsed: set[str]) -> dict:
    result: dict = {}
    if "result" not in line:
        return result

    after_result = line.split("result", 1)[1]
    if "unit" not in after_result:
        return result

    unit_split     = after_result.split("unit", 1)
    values_section = unit_split[0]
    rest           = unit_split[1]

    units_section, ref_section = rest, ""
    for sep in ("biological", "ref.", "ref interval"):
        if sep in rest:
            p = rest.split(sep, 1)
            units_section, ref_section = p[0], p[1] if len(p) > 1 else ""
            break

    # Extract values (strip H/L flags and < >)
    clean_v = re.sub(r"\b[HL]\b", " ", values_section)
    clean_v = re.sub(r"[<>]", " ", clean_v)
    values  = re.findall(r"-?\d+(?:\.\d+)?", clean_v)

    # Extract units
    unit_tokens = re.findall(r"[a-zA-Z%µ][a-zA-Z0-9%/µ^.]*", units_section)
    units       = [u for u in unit_tokens
                   if u.lower() not in UNIT_NOISE and len(u) <= 15]

    # Extract reference ranges
    ref_ranges = re.findall(r"(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)", ref_section)

    if not values:
        return result

    # Find param labels before "result" keyword
    param_section = line.split("result", 1)[0]
    found: list[tuple[int, str]] = []
    for pk, aliases in PARAM_ALIASES.items():
        if pk in already_parsed:
            continue
        for alias in sorted(aliases, key=len, reverse=True):
            pat = r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])"
            m = re.search(pat, param_section)
            if m:
                found.append((m.start(), pk))
                break
    found.sort(key=lambda x: x[0])
    seen: set[str] = set()
    ordered: list[str] = []
    for _, k in found:
        if k not in seen:
            seen.add(k); ordered.append(k)

    # Match values to params
    assigned: dict[int, str] = {}
    used_params = set(already_parsed)

    # Pass 1: fuzzy ref-range + unit filter
    for idx, (lo_s, hi_s) in enumerate(ref_ranges):
        if idx >= len(values):
            break
        raw_unit   = units[idx] if idx < len(units) else ""
        uf         = UNIT_TO_PARAMS.get(raw_unit.lower())
        pk = _fuzzy_ref_match(float(lo_s), float(hi_s), uf, used_params)
        if pk:
            assigned[idx] = pk
            used_params.add(pk)

    # Pass 2: positional fallback
    pi = 0
    for vi in range(len(values)):
        if vi in assigned:
            continue
        while pi < len(ordered) and ordered[pi] in used_params:
            pi += 1
        if pi < len(ordered):
            assigned[vi] = ordered[pi]
            used_params.add(ordered[pi])
            pi += 1

    # Build output
    for vi, pk in assigned.items():
        raw_val     = float(values[vi])
        raw_unit    = units[vi] if vi < len(units) else ""
        ref_data    = NORMAL_RANGES.get(pk, {})
        target_unit = ref_data.get("unit", raw_unit)
        converted   = _convert(raw_val, raw_unit, target_unit)
        if _sanity_ok(pk, converted):
            result[pk] = {"value": round(converted, 4), "unit": target_unit}

    return result


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

def parse_report_text(raw_text: str) -> dict[str, dict[str, any]]:
    """
    Parse raw OCR / pdfplumber text from a medical lab report.

    Returns:
        {
            "hemoglobin":      {"value": 14.5,      "unit": "g/dL"},
            "wbc_count":       {"value": 10570,     "unit": "cells/mcL"},
            "t3":              {"value": 10.1,      "unit": "ng/dL"},
            "hba1c":           {"value": 7.1,       "unit": "%"},
            "urine_glucose":   {"value": "+1",      "unit": ""},
            "urine_wbc":       {"value": 2.0,       "unit": "cells/hpf"},
            "vitamin_b12":     {"value": 148.0,     "unit": "pg/mL"},
            ...
        }

    All numeric values are unit-converted and scale-corrected.
    Analyzer only needs to compare against NORMAL_RANGES.
    """
    text  = clean_text(raw_text)
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    parsed: dict[str, dict[str, any]] = {}

    # ── Pass 1: multi-column collapsed blocks ────────────────────────────────
    for line in lines:
        if "result" in line and "unit" in line.split("result", 1)[-1]:
            block = _parse_multicolumn_line(line, set(parsed.keys()))
            for k, v in block.items():
                if k not in parsed:
                    parsed[k] = v

    # ── Pass 2: single-row lines ─────────────────────────────────────────────
    for i, line in enumerate(lines):
        for pk, aliases in PARAM_ALIASES.items():
            if pk in parsed:
                continue
            if not _alias_match(line, aliases):
                continue
            # Guard: don't match mch on mchc lines
            if pk == "mch" and "mchc" in line:
                continue
            # Guard: don't match blood_urea on blood urea nitrogen lines
            if pk == "blood_urea" and "nitrogen" in line:
                continue
            res = _parse_single_row(lines, i, pk)
            if res is not None:
                parsed[pk] = res

    print(f"\n✅ PARSED VALUES: {parsed}")
    return parsed