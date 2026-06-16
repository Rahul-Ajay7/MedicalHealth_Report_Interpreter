"""
test_nlp_critical.py
====================
NLP explanation generation for critical values + missing knowledge entries.

Run:  py app/services/test_nlp_critical.py
"""

from app.services.nlp import generate_nlp_explanations

MED = {
    "potassium": {
        "display_name": "Potassium",
        "high": {"causes": ["Kidney failure"], "impact": ["Arrhythmia"]},
    },
}


def test_critical_with_entry_leads_and_warns():
    res = {"potassium": {"value": 6.8, "unit": "mEq/L", "status": "high", "critical": True}}
    out = generate_nlp_explanations(res, MED)
    assert out and "URGENT" in out[0]
    assert "Potassium" in out[0]


def test_critical_without_entry_still_explained():
    # calcium has no entry in MED, but a critical value must still produce a line
    res = {"calcium": {"value": 14.0, "unit": "mg/dL", "status": "high", "critical": True}}
    out = generate_nlp_explanations(res, MED)
    assert len(out) == 1
    assert "URGENT" in out[0]
    assert "Calcium" in out[0]          # falls back to prettified key


def test_criticals_sorted_first():
    res = {
        "tsh":       {"value": 8, "unit": "mIU/L", "status": "high", "critical": False},
        "potassium": {"value": 6.8, "unit": "mEq/L", "status": "high", "critical": True},
    }
    out = generate_nlp_explanations(res, {**MED, "tsh": {"display_name": "TSH", "high": {"causes": ["Hypothyroidism"]}}})
    assert "URGENT" in out[0]            # critical leads regardless of dict order


def test_normal_noncritical_skipped():
    res = {"potassium": {"value": 4.2, "unit": "mEq/L", "status": "normal", "critical": False}}
    assert generate_nlp_explanations(res, MED) == []


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    passed = 0
    for fn in fns:
        try:
            fn(); print(f"PASS  {fn.__name__}"); passed += 1
        except AssertionError as e:
            print(f"FAIL  {fn.__name__}: {e}")
    print(f"\n{passed}/{len(fns)} passed")
