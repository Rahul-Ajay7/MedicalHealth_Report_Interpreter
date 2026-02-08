NORMAL_RANGES = {

    # ---------------- BLOOD: CBC ----------------
    "hemoglobin": {
        "unit": "g/dL",
        "normal_range": {
            "male": {"min": 13.0, "max": 17.0},
            "female": {"min": 12.0, "max": 15.0}
        }
    },

    "rbc_count": {
        "unit": "million cells/mcL",
        "normal_range": {
            "male": {"min": 4.7, "max": 6.1},
            "female": {"min": 4.2, "max": 5.4}
        }
    },

    "wbc_count": {
        "unit": "cells/mcL",
        "normal_range": {"min": 4000, "max": 11000}
    },

    "platelet_count": {
        "unit": "cells/mcL",
        "normal_range": {"min": 150000, "max": 450000}
    },

    "hematocrit": {
        "unit": "%",
        "normal_range": {
            "male": {"min": 40, "max": 50},
            "female": {"min": 36, "max": 44}
        }
    },

    "mcv": {
        "unit": "fL",
        "normal_range": {"min": 80, "max": 100}
    },

    "mch": {
        "unit": "pg",
        "normal_range": {"min": 27, "max": 33}
    },

    "mchc": {
        "unit": "g/dL",
        "normal_range": {"min": 32, "max": 36}
    },

    # ---------------- BLOOD: SUGAR ----------------
    "fasting_blood_glucose": {
        "unit": "mg/dL",
        "normal_range": {"min": 70, "max": 99}
    },

    "postprandial_glucose": {
        "unit": "mg/dL",
        "normal_range": {"min": 70, "max": 140}
    },

    "hba1c": {
        "unit": "%",
        "normal_range": {"min": 4.0, "max": 5.6}
    },

    # ---------------- LIPID PROFILE ----------------
    "total_cholesterol": {
        "unit": "mg/dL",
        "normal_range": {"min": 0, "max": 200}
    },

    "ldl": {
        "unit": "mg/dL",
        "normal_range": {"min": 0, "max": 100}
    },

    "hdl": {
        "unit": "mg/dL",
        "normal_range": {
            "male": {"min": 40, "max": 60},
            "female": {"min": 50, "max": 60}
        }
    },

    "triglycerides": {
        "unit": "mg/dL",
        "normal_range": {"min": 0, "max": 150}
    },

    "vldl": {
        "unit": "mg/dL",
        "normal_range": {"min": 5, "max": 40}
    },

    # ---------------- LIVER FUNCTION ----------------
    "bilirubin_total": {
        "unit": "mg/dL",
        "normal_range": {"min": 0.1, "max": 1.2}
    },

    "bilirubin_direct": {
        "unit": "mg/dL",
        "normal_range": {"min": 0.0, "max": 0.3}
    },

    "sgpt_alt": {
        "unit": "U/L",
        "normal_range": {"min": 7, "max": 56}
    },

    "sgot_ast": {
        "unit": "U/L",
        "normal_range": {"min": 10, "max": 40}
    },

    "alkaline_phosphatase": {
        "unit": "U/L",
        "normal_range": {"min": 44, "max": 147}
    },

    "albumin": {
        "unit": "g/dL",
        "normal_range": {"min": 3.5, "max": 5.0}
    },

    "total_protein": {
        "unit": "g/dL",
        "normal_range": {"min": 6.0, "max": 8.3}
    },

    # ---------------- KIDNEY FUNCTION ----------------
    "creatinine": {
        "unit": "mg/dL",
        "normal_range": {
            "male": {"min": 0.74, "max": 1.35},
            "female": {"min": 0.59, "max": 1.04}
        }
    },

    "blood_urea": {
        "unit": "mg/dL",
        "normal_range": {"min": 7, "max": 20}
    },

    "uric_acid": {
        "unit": "mg/dL",
        "normal_range": {
            "male": {"min": 3.4, "max": 7.0},
            "female": {"min": 2.4, "max": 6.0}
        }
    },

    "sodium": {
        "unit": "mEq/L",
        "normal_range": {"min": 135, "max": 145}
    },

    "potassium": {
        "unit": "mEq/L",
        "normal_range": {"min": 3.5, "max": 5.0}
    },

    "chloride": {
        "unit": "mEq/L",
        "normal_range": {"min": 96, "max": 106}
    },

    # ---------------- THYROID ----------------
    "tsh": {
        "unit": "mIU/L",
        "normal_range": {"min": 0.4, "max": 4.0}
    },

    "t3": {
        "unit": "ng/dL",
        "normal_range": {"min": 80, "max": 200}
    },

    "t4": {
        "unit": "µg/dL",
        "normal_range": {"min": 5.0, "max": 12.0}
    },

    # ---------------- URINE ANALYSIS ----------------
    "urine_ph": {
        "unit": "",
        "normal_range": {"min": 4.5, "max": 8.0}
    },

    "urine_specific_gravity": {
        "unit": "",
        "normal_range": {"min": 1.005, "max": 1.030}
    },

    "urine_rbc": {
        "unit": "cells/hpf",
        "normal_range": {"min": 0, "max": 2}
    },

    "urine_wbc": {
        "unit": "cells/hpf",
        "normal_range": {"min": 0, "max": 5}
    },

    "urine_protein": {
        "unit": "",
        "normal_range": {"expected": "negative"}
    },

    "urine_glucose": {
        "unit": "",
        "normal_range": {"expected": "negative"}
    },

    "urine_ketones": {
        "unit": "",
        "normal_range": {"expected": "negative"}
    },

    "urine_bilirubin": {
        "unit": "",
        "normal_range": {"expected": "negative"}
    }
}




#Since  building a medical report interpreter for real users:
#Always show disclaimer:
#"Reference ranges may vary slightly by laboratory."
#Some labs use:
#Different units
#Different ranges by age
#Pregnancy ranges
#For production-level accuracy later:
#Add age field
#Add lab-specific overrides
#Add critical ranges (danger levels)