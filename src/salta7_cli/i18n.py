from __future__ import annotations

import locale
import os
import re
from typing import Any, Mapping, Optional

from .locale_en import TRANSLATIONS as EN
from .locale_hi import TRANSLATIONS as HI
from .locale_ja import TRANSLATIONS as JA
from .locale_ko import TRANSLATIONS as KO

DEFAULT_LANGUAGE = "en"
SUPPORTED_LANGUAGES = ("en", "ja", "ko", "hi")
_LANGUAGE = DEFAULT_LANGUAGE

_TRANSLATIONS: dict[str, dict[str, str]] = {
    "en": EN,
    "ja": JA,
    "ko": KO,
    "hi": HI,
}

_LANGUAGE_ALIASES = {
    "en": "en", "eng": "en", "english": "en",
    "ja": "ja", "jp": "ja", "jpn": "ja", "japanese": "ja", "日本語": "ja",
    "ko": "ko", "kor": "ko", "korean": "ko", "한국어": "ko",
    "hi": "hi", "hin": "hi", "hindi": "hi", "हिन्दी": "hi", "हिंदी": "hi",
}


def _language_token(value: str) -> str:
    return re.split(r"[._@-]", value.strip().lower(), maxsplit=1)[0]


def normalize_language(value: Optional[str]) -> str:
    if not value or value.lower() == "auto":
        return detect_language()
    return _LANGUAGE_ALIASES.get(_language_token(value), DEFAULT_LANGUAGE)


def detect_language() -> str:
    for name in ("SALTA7_LANG", "LC_ALL", "LC_MESSAGES", "LANG"):
        value = os.getenv(name)
        if value:
            token = _language_token(value)
            if token in _LANGUAGE_ALIASES:
                return _LANGUAGE_ALIASES[token]
    try:
        value = locale.getlocale()[0]
    except (ValueError, TypeError):
        value = None
    if value:
        token = _language_token(value)
        if token in _LANGUAGE_ALIASES:
            return _LANGUAGE_ALIASES[token]
    return DEFAULT_LANGUAGE


def set_language(language: Optional[str]) -> str:
    global _LANGUAGE
    _LANGUAGE = normalize_language(language)
    return _LANGUAGE


def get_language() -> str:
    return _LANGUAGE


def t(key: str, default: Optional[str] = None, **values: Any) -> str:
    language_table: Mapping[str, str] = _TRANSLATIONS.get(_LANGUAGE, EN)
    text = language_table.get(key)
    if text is None:
        text = EN.get(key, default if default is not None else key)
    try:
        return text.format(**values)
    except (KeyError, ValueError):
        return text


set_language(os.getenv("SALTA7_LANG", "auto"))
