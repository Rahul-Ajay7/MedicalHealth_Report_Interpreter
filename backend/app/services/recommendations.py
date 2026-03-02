import json
from pathlib import Path
from typing import Dict, Any


# ------------------------------------------------------------------
# Load medical knowledge (JSON-based clinical rules)
# ------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
KNOWLEDGE_PATH = BASE_DIR / "medical_knowledge.json"

if not KNOWLEDGE_PATH.exists():
    raise FileNotFoundError(f"medical_knowledge.json not found at {KNOWLEDGE_PATH}")

with open(KNOWLEDGE_PATH, "r", encoding="utf-8") as f:
    MEDICAL_KNOWLEDGE: Dict[str, Any] = json.load(f)


# ------------------------------------------------------------------
# Core recommendation generator
# ------------------------------------------------------------------

def generate_recommendations(final_results: dict, gender: str) -> dict:
    """
    Generate lifestyle, non-prescription (OTC),
    and doctor-consultation recommendations
    based on analyzer output.

    Args:
        final_results (dict): analyzer output -> final_results
        gender (str): 'male' or 'female'

    Returns:
        dict: recommendations grouped for frontend consumption
    """

    lifestyle_tips = []
    non_prescription = []
    doctor_consultation = []

    for param_key, param_data in final_results.items():
        # Normalize status safely
        raw_status = param_data.get("status", "")
        status = raw_status.strip().lower()

        # Skip normal values
        if status == "normal":
            continue

        # Fetch medical knowledge for this parameter
        knowledge = MEDICAL_KNOWLEDGE.get(param_key)
        if not knowledge:
            continue

        # Fetch status-specific rules (low / high)
        status_block = knowledge.get(status)
        if not status_block:
            continue

        display_name = knowledge.get("display_name", param_key)

        # ----------------------------------------------------------
        # 1) Lifestyle recommendations
        # ----------------------------------------------------------
        lifestyle = status_block.get("lifestyle")
        if isinstance(lifestyle, list) and lifestyle:
            lifestyle_tips.append({
                "parameter": display_name,
                "status": status,
                "tips": lifestyle
            })

        # ----------------------------------------------------------
        # 2) Non-prescription (OTC) support
        # ----------------------------------------------------------
        otc_support = status_block.get("otc_support", {})
        safe_options = otc_support.get("safe_options")

        if isinstance(safe_options, list) and safe_options:
            non_prescription.append({
                "parameter": display_name,
                "options": safe_options,
                "note": otc_support.get("note")
            })

        # ----------------------------------------------------------
        # 3) Doctor consultation / prescription warning
        # ----------------------------------------------------------
        prescription_required = status_block.get("prescription_required")
        medical_attention = status_block.get("medical_attention")

        if prescription_required:
            doctor_consultation.append({
                "parameter": display_name,
                "conditions": prescription_required.get("conditions", []),
                "instruction": prescription_required.get("instruction")
            })
        elif medical_attention:
            doctor_consultation.append({
                "parameter": display_name,
                "instruction": medical_attention
            })

    return {
        "lifestyle_tips": lifestyle_tips,
        "non_prescription": non_prescription,
        "doctor_consultation": doctor_consultation
    }