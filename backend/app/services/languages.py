"""
languages.py  —  supported output languages for HealthAI
=========================================================
Covers the Duolingo course set. Each entry: ISO-ish code → (English name,
native name). The English name is what we feed the LLM ("Respond in Hindi"),
which it understands more reliably than a code.

`normalize_language()` accepts a code, English name, or native name (any case)
and returns the canonical English name, or None if unsupported. Callers treat
None / "English" as the default (no translation).
"""

from typing import Optional

# code → (english_name, native_name)
LANGUAGES: dict[str, tuple[str, str]] = {
    "en":  ("English",            "English"),
    "es":  ("Spanish",            "Español"),
    "fr":  ("French",             "Français"),
    "de":  ("German",             "Deutsch"),
    "it":  ("Italian",            "Italiano"),
    "pt":  ("Portuguese",         "Português"),
    "nl":  ("Dutch",              "Nederlands"),
    "ga":  ("Irish",              "Gaeilge"),
    "da":  ("Danish",             "Dansk"),
    "sv":  ("Swedish",            "Svenska"),
    "no":  ("Norwegian",          "Norsk"),
    "ru":  ("Russian",            "Русский"),
    "pl":  ("Polish",             "Polski"),
    "cs":  ("Czech",              "Čeština"),
    "uk":  ("Ukrainian",          "Українська"),
    "el":  ("Greek",              "Ελληνικά"),
    "hu":  ("Hungarian",          "Magyar"),
    "ro":  ("Romanian",           "Română"),
    "tr":  ("Turkish",            "Türkçe"),
    "he":  ("Hebrew",             "עברית"),
    "ar":  ("Arabic",             "العربية"),
    "hi":  ("Hindi",              "हिन्दी"),
    "ja":  ("Japanese",           "日本語"),
    "ko":  ("Korean",             "한국어"),
    "zh":  ("Chinese",            "中文"),
    "vi":  ("Vietnamese",         "Tiếng Việt"),
    "id":  ("Indonesian",         "Bahasa Indonesia"),
    "haw": ("Hawaiian",           "ʻŌlelo Hawaiʻi"),
    "nv":  ("Navajo",             "Diné bizaad"),
    "cy":  ("Welsh",              "Cymraeg"),
    "eo":  ("Esperanto",          "Esperanto"),
    "la":  ("Latin",              "Latina"),
    "hv":  ("High Valyrian",      "High Valyrian"),
    "tlh": ("Klingon",            "tlhIngan Hol"),
    "sw":  ("Swahili",            "Kiswahili"),
    "gd":  ("Scottish Gaelic",    "Gàidhlig"),
    "yi":  ("Yiddish",            "ייִדיש"),
    "ht":  ("Haitian Creole",     "Kreyòl ayisyen"),
    "zu":  ("Zulu",               "isiZulu"),
    "fi":  ("Finnish",            "Suomi"),
    "ca":  ("Catalan",            "Català"),
    "gn":  ("Guarani",            "Guaraní"),
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
