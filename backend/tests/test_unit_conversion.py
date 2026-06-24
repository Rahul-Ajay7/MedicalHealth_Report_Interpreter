"""
test_unit_conversion.py
=======================
Tests for the parameter-aware unit conversion layer in parser.py.

Verifies that the SAME raw unit (e.g. mmol/L) converts to each analyte's
canonical unit with the correct analyte-specific factor.

Run:  py -m pytest app/services/test_unit_conversion.py
  or: py app/services/test_unit_conversion.py   (plain asserts, no pytest)
"""

from app.services.parser import _convert, _norm_unit


def approx(a: float, b: float, tol: float = 0.5) -> bool:
    return abs(a - b) <= tol


# ── _norm_unit collapses spellings ────────────────────────────────────────────
def test_norm_unit():
    assert _norm_unit("µmol/L") == "umol/l"
    assert _norm_unit("micromol/L") == "umol/l"
    assert _norm_unit("mcg/dL") == "ug/dl"
    assert _norm_unit("micro g/dL") == "ug/dl"
    assert _norm_unit("mIU/L") == "miu/l"        # milli stays milli
    assert _norm_unit("microIU/mL") == "uiu/ml"  # micro collapses
    assert _norm_unit("  G/DL ") == "g/dl"


# ── mmol/L → mg/dL is analyte-specific (the core bug this fixes) ───────────────
def test_mmol_per_analyte():
    # glucose 5.5 mmol/L ≈ 99 mg/dL
    assert approx(_convert(5.5, "mmol/L", "mg/dL", "fasting_blood_glucose"), 99.1)
    # total cholesterol 5.0 mmol/L ≈ 193 mg/dL
    assert approx(_convert(5.0, "mmol/L", "mg/dL", "total_cholesterol"), 193.3)
    # triglycerides 2.0 mmol/L ≈ 177 mg/dL
    assert approx(_convert(2.0, "mmol/L", "mg/dL", "triglycerides"), 177.1)
    # calcium 2.4 mmol/L ≈ 9.6 mg/dL
    assert approx(_convert(2.4, "mmol/L", "mg/dL", "calcium"), 9.6, tol=0.1)


# ── Kidney panel SI → conventional ────────────────────────────────────────────
def test_kidney():
    # creatinine 88.4 µmol/L ≈ 1.0 mg/dL
    assert approx(_convert(88.4, "µmol/L", "mg/dL", "creatinine"), 1.0, tol=0.05)
    # urea 6.0 mmol/L ≈ 36 mg/dL
    assert approx(_convert(6.0, "mmol/L", "mg/dL", "blood_urea"), 36.0, tol=0.5)
    # uric acid 360 µmol/L ≈ 6.05 mg/dL
    assert approx(_convert(360.0, "µmol/L", "mg/dL", "uric_acid"), 6.05, tol=0.1)


# ── Liver bilirubin ───────────────────────────────────────────────────────────
def test_bilirubin():
    # 17.1 µmol/L ≈ 1.0 mg/dL
    assert approx(_convert(17.1, "µmol/L", "mg/dL", "bilirubin_total"), 1.0, tol=0.05)


# ── Proteins g/L → g/dL ───────────────────────────────────────────────────────
def test_proteins():
    assert approx(_convert(70.0, "g/L", "g/dL", "total_protein"), 7.0, tol=0.01)
    assert approx(_convert(140.0, "g/L", "g/dL", "hemoglobin"), 14.0, tol=0.01)


# ── Iron studies µmol/L → µg/dL ───────────────────────────────────────────────
def test_iron():
    # 18 µmol/L ≈ 100 µg/dL
    assert approx(_convert(18.0, "µmol/L", "µg/dL", "serum_iron"), 100.6, tol=1.0)


# ── Vitamins ──────────────────────────────────────────────────────────────────
def test_vitamins():
    # vitamin D 75 nmol/L ≈ 30 ng/mL
    assert approx(_convert(75.0, "nmol/L", "ng/mL", "vitamin_d"), 30.0, tol=0.5)
    # B12 300 pmol/L ≈ 407 pg/mL
    assert approx(_convert(300.0, "pmol/L", "pg/mL", "vitamin_b12"), 406.5, tol=2.0)


# ── HbA1c IFCC (mmol/mol) → NGSP (%) is affine ────────────────────────────────
def test_hba1c_ifcc():
    # 48 mmol/mol ≈ 6.5 %
    assert approx(_convert(48.0, "mmol/mol", "%", "hba1c"), 6.54, tol=0.1)
    # 53 mmol/mol ≈ 7.0 %
    assert approx(_convert(53.0, "mmol/mol", "%", "hba1c"), 7.0, tol=0.1)


# ── Thyroid ───────────────────────────────────────────────────────────────────
def test_thyroid():
    # T3 1.2 ng/mL = 120 ng/dL  (1 ng/mL = 100 ng/dL)
    assert approx(_convert(1.2, "ng/mL", "ng/dL", "t3"), 120.0, tol=0.1)
    # T3 1.8 nmol/L ≈ 117 ng/dL
    assert approx(_convert(1.8, "nmol/L", "ng/dL", "t3"), 117.2, tol=2.0)
    # T4 100 nmol/L ≈ 7.77 µg/dL
    assert approx(_convert(100.0, "nmol/L", "µg/dL", "t4"), 7.77, tol=0.1)


# ── Electrolytes mmol/L ≡ mEq/L (monovalent) ──────────────────────────────────
def test_electrolytes():
    assert approx(_convert(140.0, "mmol/L", "mEq/L", "sodium"), 140.0, tol=0.01)


# ── No-op cases ───────────────────────────────────────────────────────────────
def test_noop():
    # already canonical
    assert _convert(99.0, "mg/dL", "mg/dL", "fasting_blood_glucose") == 99.0
    # missing raw unit → unchanged
    assert _convert(99.0, "", "mg/dL", "fasting_blood_glucose") == 99.0


# ── Regression: existing same-scale aliases still work ────────────────────────
def test_generic_aliases():
    # platelet lakhs/cumm → cells/mcL ×100000
    assert _convert(2.5, "lakhs/cumm", "cells/mcL", "platelet_count") == 250000.0
    # WBC 10^3/µL → cells/mcL ×1000
    assert _convert(10.5, "10^3/µL", "cells/mcL", "wbc_count") == 10500.0


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
