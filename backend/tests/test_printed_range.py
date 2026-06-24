"""
test_printed_range.py
======================
Tests for lab-printed reference range support.

The parser captures a two-sided reference range printed ON the report and the
analyzer prefers it over the hardcoded range — but ONLY when it passes
validation (well-formed, inside sanity bounds, close to the hardcoded range).
A misread range must never be trusted, since it could hide a critical value.

Run:  py -m pytest app/services/test_printed_range.py
  or: py app/services/test_printed_range.py   (plain asserts, no pytest)
"""

from app.services.parser import _extract_printed_range, parse_report_text
from app.services.analyzer import analyze_parameters, _validate_printed_range


# ── _extract_printed_range: two-sided only, converts to canonical ─────────────
def test_extract_basic():
    r = _extract_printed_range("14.5 g/dl 13.0 - 17.0", "g/dl", "g/dL", "hemoglobin")
    assert r == {"min": 13.0, "max": 17.0}


def test_extract_en_dash():
    r = _extract_printed_range("13.0 – 17.0", "g/dl", "g/dL", "hemoglobin")
    assert r == {"min": 13.0, "max": 17.0}


def test_extract_after_pos_skips_name():
    # "25(oh)" digits sit before after_pos and must not be read as a range
    text = "25(oh) vitamin d 30.0 ng/ml 30.0 - 100.0"
    r = _extract_printed_range(text, "ng/ml", "ng/mL", "vitamin_d", after_pos=16)
    assert r == {"min": 30.0, "max": 100.0}


def test_extract_converts_units():
    # creatinine printed in µmol/L → canonical mg/dL
    r = _extract_printed_range("62 - 106 umol/l", "umol/l", "mg/dL", "creatinine")
    assert r is not None
    assert abs(r["min"] - 0.70) < 0.05
    assert abs(r["max"] - 1.20) < 0.05


def test_extract_none_when_no_range():
    assert _extract_printed_range("14.5 g/dl", "g/dl", "g/dL", "hemoglobin") is None


def test_extract_none_when_inverted():
    assert _extract_printed_range("17.0 - 13.0", "g/dl", "g/dL", "hemoglobin") is None


# ── _validate_printed_range: trust gate ───────────────────────────────────────
HC_HB = {"min": 13.0, "max": 17.0}


def test_validate_accepts_close():
    # lab range slightly different from hardcoded → trusted
    assert _validate_printed_range({"min": 13.5, "max": 17.5}, HC_HB, "hemoglobin")


def test_validate_rejects_malformed():
    assert not _validate_printed_range({"min": 17.0, "max": 13.0}, HC_HB, "hemoglobin")
    assert not _validate_printed_range({"min": None, "max": 17.0}, HC_HB, "hemoglobin")
    assert not _validate_printed_range(None, HC_HB, "hemoglobin")


def test_validate_rejects_out_of_sanity():
    # hemoglobin sanity is (3, 25); a "0.5 - 0.9" OCR garble is impossible
    assert not _validate_printed_range({"min": 0.5, "max": 0.9}, HC_HB, "hemoglobin")


def test_validate_rejects_far_from_hardcoded():
    # within sanity but 3x off the hardcoded reference → distrust (OCR shift)
    assert not _validate_printed_range({"min": 3.5, "max": 4.5}, HC_HB, "hemoglobin")


# ── End-to-end: analyzer prefers a valid printed range ────────────────────────
def test_analyzer_prefers_printed():
    parsed = {
        "hemoglobin": {"value": 12.5, "unit": "g/dL",
                       "printed_range": {"min": 12.0, "max": 16.0}},
    }
    out = analyze_parameters(parsed, gender="male")["hemoglobin"]
    # hardcoded male range is 13-17 → 12.5 would be LOW; lab range 12-16 → NORMAL
    assert out["range_source"] == "report"
    assert out["normal_range"] == {"min": 12.0, "max": 16.0}
    assert out["status"] == "normal"


def test_analyzer_falls_back_on_garbage():
    parsed = {
        "hemoglobin": {"value": 12.5, "unit": "g/dL",
                       "printed_range": {"min": 0.5, "max": 0.9}},
    }
    out = analyze_parameters(parsed, gender="male")["hemoglobin"]
    # garbage range rejected → hardcoded 13-17 used → 12.5 is LOW
    assert out["range_source"] == "reference"
    assert out["normal_range"] == {"min": 13.0, "max": 17.0}
    assert out["status"] == "low"


def test_analyzer_no_printed_range():
    parsed = {"hemoglobin": {"value": 14.0, "unit": "g/dL"}}
    out = analyze_parameters(parsed, gender="male")["hemoglobin"]
    assert out["range_source"] == "reference"
    assert out["status"] == "normal"


# ── Parser end-to-end: a single-row line yields printed_range ─────────────────
def test_parser_captures_printed_range():
    text = "Hemoglobin 14.5 g/dL 13.0 - 17.0"
    parsed = parse_report_text(text)
    assert "hemoglobin" in parsed
    assert parsed["hemoglobin"]["printed_range"] == {"min": 13.0, "max": 17.0}


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
