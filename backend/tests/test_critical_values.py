"""
test_critical_values.py
========================
Tests for absolute critical / panic value flagging.

Panic thresholds are clinical absolutes — they flag regardless of the printed
or hardcoded reference range, and only ever ADD urgency. (Thresholds still need
clinician sign-off before production.)

Run:  py -m pytest app/services/test_critical_values.py
  or: py app/services/test_critical_values.py
"""

from app.services.analyzer import is_critical, analyze_parameters


# ── is_critical: thresholds ───────────────────────────────────────────────────
def test_potassium_high():
    assert is_critical("potassium", 6.5)
    assert is_critical("potassium", 6.0)        # at threshold
    assert not is_critical("potassium", 5.0)


def test_potassium_low():
    assert is_critical("potassium", 2.4)
    assert not is_critical("potassium", 3.5)


def test_glucose_extremes():
    assert is_critical("fasting_blood_glucose", 45)
    assert is_critical("fasting_blood_glucose", 450)
    assert not is_critical("fasting_blood_glucose", 110)


def test_high_only_param():
    # creatinine has no low panic value
    assert is_critical("creatinine", 8.0)
    assert not is_critical("creatinine", 0.1)


def test_non_critical_param():
    assert not is_critical("tsh", 99)           # not in table


def test_non_numeric_value():
    assert not is_critical("urine_protein", "positive")


# ── analyze_parameters: flag + severity wiring ────────────────────────────────
def test_analyzer_flags_critical_even_when_in_range():
    # 6.5 potassium but suppose a lab range said up to 6.5 → must still flag
    parsed = {
        "potassium": {"value": 6.6, "unit": "mEq/L",
                      "printed_range": {"min": 3.5, "max": 7.0}},
    }
    out = analyze_parameters(parsed)["potassium"]
    assert out["critical"] is True


def test_analyzer_normal_value_not_critical():
    parsed = {"potassium": {"value": 4.2, "unit": "mEq/L"}}
    out = analyze_parameters(parsed)["potassium"]
    assert out["critical"] is False


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    passed = 0
    for fn in fns:
        try:
            fn()
            print(f"PASS  {fn.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"FAIL  {fn.__name__}: {e}")
    print(f"\n{passed}/{len(fns)} passed")
