"""
languages.py  —  supported output languages for HealthAI
=========================================================
India-first. Covers all 22 languages of the Eighth Schedule of the Indian
Constitution (the project's core audience), plus English and a few common
international languages for the diaspora. Each entry: ISO-ish code → (English
name, native name). The English name is what we feed the LLM ("Respond in
Tamil"), which it understands more reliably than a code.

`normalize_language()` accepts a code, English name, or native name (any case)
and returns the canonical English name, or None if unsupported. Callers treat
None / "English" as the default (no translation).

NOTE: LLM translation quality is strong for high-resource Indian languages
(Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi,
Urdu, Odia) and weaker for low-resource ones (Bodo, Santali, Dogri, Maithili,
Konkani, Manipuri, Sindhi, Kashmiri, Sanskrit). Per-language MEDICAL accuracy is
NOT clinician-verified — surface a "machine-translated" note for non-English.
"""

from typing import Optional

# code → (english_name, native_name)
LANGUAGES: dict[str, tuple[str, str]] = {
    "en":  ("English",   "English"),

    # ── India — 22 Eighth Schedule languages ────────────────────────────────
    "hi":  ("Hindi",     "हिन्दी"),
    "bn":  ("Bengali",   "বাংলা"),
    "te":  ("Telugu",    "తెలుగు"),
    "mr":  ("Marathi",   "मराठी"),
    "ta":  ("Tamil",     "தமிழ்"),
    "ur":  ("Urdu",      "اردو"),
    "gu":  ("Gujarati",  "ગુજરાતી"),
    "kn":  ("Kannada",   "ಕನ್ನಡ"),
    "ml":  ("Malayalam", "മലയാളം"),
    "pa":  ("Punjabi",   "ਪੰਜਾਬੀ"),
    "or":  ("Odia",      "ଓଡ଼ିଆ"),
    "as":  ("Assamese",  "অসমীয়া"),
    "mai": ("Maithili",  "मैथिली"),
    "sa":  ("Sanskrit",  "संस्कृतम्"),
    "kok": ("Konkani",   "कोंकणी"),
    "ne":  ("Nepali",    "नेपाली"),
    "sd":  ("Sindhi",    "سنڌي"),
    "ks":  ("Kashmiri",  "کٲشُر"),
    "doi": ("Dogri",     "डोगरी"),
    "mni": ("Manipuri",  "মৈতৈলোন্"),
    "brx": ("Bodo",      "बड़ो"),
    "sat": ("Santali",   "ᱥᱟᱱᱛᱟᱲᱤ"),

    # ── Common international (diaspora / broader reach) ──────────────────────
    "es":  ("Spanish",   "Español"),
    "fr":  ("French",    "Français"),
    "ar":  ("Arabic",    "العربية"),
    "zh":  ("Chinese",   "中文"),
}

# Reverse lookups built once (all lowercase).
_BY_CODE    = {code: eng for code, (eng, _nat) in LANGUAGES.items()}
_BY_ENGLISH = {eng.lower(): eng for (eng, _nat) in LANGUAGES.values()}
_BY_NATIVE  = {nat.lower(): eng for (eng, nat) in LANGUAGES.values()}


def normalize_language(value: Optional[str]) -> Optional[str]:
    """
    Resolve a code / English name / native name to its canonical English name.
    Returns None for missing/unsupported input (caller defaults to English).
    """
    if not value:
        return None
    v = value.strip().lower()
    if v in _BY_CODE:
        return _BY_CODE[v]
    if v in _BY_ENGLISH:
        return _BY_ENGLISH[v]
    if v in _BY_NATIVE:
        return _BY_NATIVE[v]
    return None


def is_english(name: Optional[str]) -> bool:
    """True when the resolved language is English or unset (no translation needed)."""
    return not name or name.strip().lower() in ("en", "english")


def supported_languages() -> list[dict[str, str]]:
    """List for a frontend selector: [{code, name, native}, ...]."""
    return [
        {"code": code, "name": eng, "native": nat}
        for code, (eng, nat) in LANGUAGES.items()
    ]
