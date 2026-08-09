from __future__ import annotations

import json
import os
import stat
from pathlib import Path
from typing import Any, Dict, Optional

from .client import CLIError
from .i18n import t

HUMANIZE_FIELDS = {"avatar", "banner", "name", "bio", "pronouns", "hypesquad"}


def ensure_range(value: int, low: int, high: int, label: str) -> None:
    if not low <= value <= high:
        raise CLIError(t("utils.range", label=label, low=low, high=high))


def load_tokens(path: str) -> list[str]:
    p = Path(path).expanduser()
    if not p.is_file():
        raise CLIError(t("utils.tokens_not_found", path=path))
    tokens = [line.strip() for line in p.read_text(encoding="utf-8").splitlines() if line.strip()]
    if not tokens:
        raise CLIError(t("utils.tokens_empty"))
    if len(tokens) > 100:
        raise CLIError(t("utils.tokens_max"))
    return tokens


def token_file_permissions_warning(path: str) -> Optional[str]:
    if os.name == "nt":
        return None
    p = Path(path).expanduser()
    try:
        mode = stat.S_IMODE(p.stat().st_mode)
    except OSError:
        return None
    if mode & (stat.S_IRWXG | stat.S_IRWXO):
        return t("utils.tokens_permissions", mode=oct(mode), path=p)
    return None


def load_json_value(value: Optional[str]) -> Optional[Dict[str, Any]]:
    if value is None:
        return None
    if value.startswith("@"):
        p = Path(value[1:]).expanduser()
        if not p.is_file():
            raise CLIError(t("utils.json_not_found", path=p))
        raw = p.read_text(encoding="utf-8")
    else:
        raw = value
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise CLIError(t("utils.invalid_json", error=exc)) from exc
    if not isinstance(parsed, dict):
        raise CLIError(t("utils.humanize_object"))
    validate_humanize(parsed)
    return parsed


def validate_humanize(value: Dict[str, Any]) -> None:
    if not value:
        raise CLIError(t("utils.humanize_empty"))
    unknown = set(value) - HUMANIZE_FIELDS
    if unknown:
        raise CLIError(t("utils.humanize_unknown", fields=", ".join(sorted(unknown))))
    for field, spec in value.items():
        if not isinstance(spec, dict):
            raise CLIError(t("utils.humanize_field_object", field=field))
        source = spec.get("source")
        if source not in {"random", "custom"}:
            raise CLIError(t("utils.humanize_source", field=field))
        if field == "banner" and source == "random":
            raise CLIError(t("utils.banner_custom"))
        if source == "custom" and "value" not in spec:
            raise CLIError(t("utils.custom_value", field=field))
        custom = spec.get("value") if source == "custom" else None
        if field == "name" and isinstance(custom, str) and len(custom) > 32:
            raise CLIError(t("utils.name_length"))
        if field == "bio" and isinstance(custom, str) and len(custom) > 190:
            raise CLIError(t("utils.bio_length"))
        if field == "pronouns" and isinstance(custom, str) and len(custom) > 40:
            raise CLIError(t("utils.pronouns_length"))
        if field == "hypesquad" and source == "custom" and str(custom) not in {"1", "2", "3"}:
            raise CLIError(t("utils.hypesquad_value"))
