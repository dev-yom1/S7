from __future__ import annotations

import json
import os
import shutil
import sys
import textwrap
import unicodedata
import time
from typing import Any, Dict, Optional, Tuple

from . import __version__
from .i18n import get_language, t

COLOR_ENABLED = False
ANSI = {
    "reset": "\033[0m",
    "bold": "\033[1m",
    "dim": "\033[2m",
    "red": "\033[31m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "cyan": "\033[36m",
    "bright_cyan": "\033[96m",
    "white": "\033[97m",
}
SENSITIVE_KEYS = {
    "token",
    "tokens",
    "item_data",
    "authorization",
    "api_token",
    "password",
    "pass",
}

CARD_PRIORITY_KEYS = (
    "title",
    "name",
    "product",
    "account",
    "price",
    "amount",
    "quantity",
    "status",
    "id",
    "format",
    "stock",
    "warranty",
    "description",
    "details",
    "admin_only",
)


def configure_color(no_color: bool, json_mode: bool) -> None:
    global COLOR_ENABLED
    COLOR_ENABLED = supports_color(no_color) and not json_mode


def supports_color(no_color: bool = False) -> bool:
    if no_color or os.getenv("NO_COLOR") is not None:
        return False
    if os.getenv("TERM", "").lower() == "dumb":
        return False
    return bool(getattr(sys.stdout, "isatty", lambda: False)())


def paint(text: Any, *styles: str) -> str:
    rendered = str(text)
    if not COLOR_ENABLED or not styles:
        return rendered
    prefix = "".join(ANSI[s] for s in styles if s in ANSI)
    return f"{prefix}{rendered}{ANSI['reset']}"


def full_logo() -> None:
    logo = r"""
   _____  _____
  / ___/ /__  /
  \__ \    / /
 ___/ /   / /
/____/   /_/
""".strip("\n")
    print(paint(logo, "bold", "bright_cyan"))
    print(f"  {paint('S A L T A 7   C L I', 'bold', 'white')}  {paint('v' + __version__, 'dim')}")
    print(f"  {paint(t('logo.tagline'), 'dim')}")
    print()


def command_banner(title: str) -> None:
    print(f"{paint('⚡ S7', 'bold', 'bright_cyan')} {paint('•', 'dim')} {paint(title, 'bold')}\n")


def timestamp() -> str:
    return time.strftime("%H:%M:%S")


def log_line(icon: str, message: str, *, stream: Any = None) -> None:
    stream = stream or sys.stdout
    icon_style = {"✓": "green", "⟳": "cyan", "!": "yellow", "✗": "red", "•": "dim"}.get(icon)
    rendered_icon = paint(icon, icon_style) if icon_style else icon
    print(f"{paint('[' + timestamp() + ']', 'dim')} {rendered_icon} {message}", file=stream)


def print_json(data: Any, compact: bool = False) -> None:
    if compact:
        print(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    else:
        print(json.dumps(data, ensure_ascii=False, indent=2))


def print_jsonl(data: Any) -> None:
    print(json.dumps(data, ensure_ascii=False, separators=(",", ":")))


def pretty_label(key: str) -> str:
    translated = t(f"field.{key.lower()}", default="")
    if translated and translated != f"field.{key.lower()}":
        return translated
    label = key.replace("_", " ").strip().title()
    replacements = {
        "Id": "ID",
        "Api": "API",
        "Url": "URL",
        "Byot": "BYOT",
    }
    return " ".join(replacements.get(part, part) for part in label.split())


def scalar_text(value: Any) -> str:
    if value is None:
        return "-"
    if isinstance(value, bool):
        return t("common.yes") if value else t("common.no")
    return str(value)


def has_display_value(value: Any) -> bool:
    """Return False for values that add no useful information to human output."""
    return value not in (None, "", [], {})


def ordered_record_items(data: Dict[str, Any]) -> list[tuple[str, Any]]:
    """Put common product/task fields first while preserving all unknown fields."""
    keys = list(data.keys())
    ordered: list[str] = []
    for key in CARD_PRIORITY_KEYS:
        if key in data:
            ordered.append(key)
    ordered.extend(key for key in keys if key not in ordered)
    return [(key, data[key]) for key in ordered if has_display_value(data[key])]


def _display_width(text: str) -> int:
    width = 0
    for ch in text:
        # Combining marks (important for Devanagari) occupy the base glyph's cell.
        if unicodedata.combining(ch) or unicodedata.category(ch) in {"Mn", "Mc", "Me", "Cf"}:
            continue
        width += 2 if unicodedata.east_asian_width(ch) in {"W", "F"} else 1
    return width


def _pad_display(text: str, width: int) -> str:
    return text + " " * max(0, width - _display_width(text))


def _wrapped_field_lines(label: str, value: str, *, label_width: int, indent: int) -> list[str]:
    terminal_width = shutil.get_terminal_size(fallback=(100, 24)).columns
    prefix_width = indent + label_width + 2
    content_width = max(24, terminal_width - prefix_width)
    wrapped = textwrap.wrap(value, width=content_width, replace_whitespace=False) or [""]
    first_prefix = f"{' ' * indent}{paint(_pad_display(label, label_width), 'dim')}  "
    next_prefix = " " * prefix_width
    return [first_prefix + wrapped[0], *(next_prefix + line for line in wrapped[1:])]


def render_record_card(
    data: Dict[str, Any],
    index: int,
    *,
    reveal_secrets: bool = False,
    indent: int = 11,
) -> None:
    """Render one list item as a compact, wrapped terminal card."""
    safe = sanitize(data, reveal_secrets=reveal_secrets)
    items = ordered_record_items(safe)

    title = safe.get("title") or safe.get("name") or safe.get("product") or f"#{index}"
    print(f"{' ' * indent}{paint(str(index) + '.', 'dim')} {paint(title, 'bold', 'cyan')}")

    body = [(key, value) for key, value in items if key not in {"title", "name"}]
    if not body:
        return

    label_width = min(16, max(_display_width(pretty_label(key)) for key, _ in body))
    for key, value in body:
        label = pretty_label(key)
        if isinstance(value, dict):
            rendered = json.dumps(value, ensure_ascii=False, separators=(", ", ": "))
        elif isinstance(value, list):
            rendered = ", ".join(scalar_text(item) for item in value)
        else:
            rendered = scalar_text(value)
        for line in _wrapped_field_lines(label, rendered, label_width=label_width, indent=indent + 2):
            print(line)
    print()


def mask_secret(value: Any) -> str:
    text = str(value)
    if not text:
        return "***"
    if len(text) <= 8:
        return "***"
    return f"{text[:3]}…{text[-3:]}"


def sanitize(value: Any, *, reveal_secrets: bool = False, key: str = "") -> Any:
    if reveal_secrets:
        return value
    key_lower = key.lower()
    if key_lower in SENSITIVE_KEYS:
        if isinstance(value, list):
            return t("common.redacted_items", count=len(value))
        return mask_secret(value)
    if isinstance(value, dict):
        return {k: sanitize(v, reveal_secrets=False, key=k) for k, v in value.items()}
    if isinstance(value, list):
        return [sanitize(v, reveal_secrets=False) for v in value]
    return value


def print_fields(
    data: Dict[str, Any],
    *,
    indent: int = 11,
    skip: Optional[set[str]] = None,
    reveal_secrets: bool = False,
) -> None:
    skip = skip or set()
    pad = " " * indent
    safe = sanitize(data, reveal_secrets=reveal_secrets)
    for key, value in safe.items():
        if key in skip:
            continue
        label = pretty_label(key)
        if isinstance(value, dict):
            print(f"{pad}{paint(label, 'dim')}:")
            for subkey, subvalue in value.items():
                rendered = (
                    json.dumps(subvalue, ensure_ascii=False)
                    if isinstance(subvalue, (dict, list))
                    else scalar_text(subvalue)
                )
                print(f"{pad}  {paint(pretty_label(subkey), 'dim')}: {rendered}")
        elif isinstance(value, list):
            print(f"{pad}{paint(label, 'dim')}: {t('common.item_count', count=len(value))}")
            for index, item in enumerate(value, 1):
                if isinstance(item, dict):
                    render_record_card(item, index, reveal_secrets=reveal_secrets, indent=indent + 2)
                else:
                    print(f"{pad}  {index}. {scalar_text(item)}")
        else:
            print(f"{pad}{paint(label, 'dim')}: {scalar_text(value)}")


def render_result(data: Any, title: Optional[str] = None, *, reveal_secrets: bool = False) -> None:
    title = title or t("common.result")
    if isinstance(data, dict):
        icon = "✓" if data.get("success") is not False else "✗"
        log_line(icon, title)
        print_fields(data, reveal_secrets=reveal_secrets)
    elif isinstance(data, list):
        log_line("✓", f"{title} ({t('common.item_count', count=len(data))})")
        for index, item in enumerate(data, 1):
            item = sanitize(item, reveal_secrets=reveal_secrets)
            if isinstance(item, dict):
                render_record_card(item, index, reveal_secrets=reveal_secrets)
            else:
                print(f"           {index}. {scalar_text(item)}")
    else:
        log_line("✓", f"{title}: {scalar_text(data)}")


def progress_bar(delivered: int, requested: int, width: int = 16) -> str:
    if requested <= 0:
        return ""
    ratio = max(0.0, min(float(delivered) / float(requested), 1.0))
    filled = int(round(ratio * width))
    bar = "█" * filled + "░" * (width - filled)
    return paint(bar, "green" if delivered >= requested else "cyan")


def task_counts(job: Dict[str, Any]) -> Tuple[Optional[int], Optional[int], str]:
    status_tool = str(job.get("tool") or job.get("task") or "").lower()
    if status_tool == "humanize" or "humanized" in job or "humanize_failed" in job:
        requested = job.get("quantity") or job.get("requested") or job.get("total")
        delivered = job.get("humanized")
        noun = t("task.humanized")
    else:
        requested = (
            job.get("boosts_requested")
            or job.get("boosts")
            or job.get("quantity")
            or job.get("requested")
            or job.get("total")
        )
        delivered = job.get("boosts_delivered") if job.get("boosts_delivered") is not None else job.get("delivered")
        noun = t("task.delivered")

    def as_int(v: Any) -> Optional[int]:
        try:
            return int(v) if v is not None else None
        except (TypeError, ValueError):
            return None

    return as_int(requested), as_int(delivered), noun


def task_signature(job: Any) -> tuple[Any, ...]:
    if not isinstance(job, dict):
        return (str(job),)
    requested, delivered, _ = task_counts(job)
    return (
        str(job.get("status", "")).lower(),
        requested,
        delivered,
        job.get("failed_count"),
        job.get("humanized"),
        job.get("humanize_failed"),
        job.get("error"),
    )


def render_task_created(result: Any, payload: Dict[str, Any]) -> None:
    if not isinstance(result, dict):
        render_result(result, t("task.created"))
        return
    log_line("✓", t("task.created"))
    if result.get("job_id"):
        print(f"           {paint(t('field.job_id'), 'dim')}: {paint(result['job_id'], 'bold', 'cyan')}")
    print(f"           {paint(t('field.tool'), 'dim')}: {paint(str(payload.get('tool', '-')).title(), 'bold')}")
    print(f"           {paint(t('field.mode'), 'dim')}: {paint(str(payload.get('mode', '-')).upper(), 'bold')}")
    requested = payload.get("boosts") or payload.get("quantity")
    if requested is None and isinstance(payload.get("tokens"), list):
        requested = len(payload["tokens"])
    if requested is not None:
        print(f"           {paint(t('field.requested'), 'dim')}: {paint(requested, 'bold')}")
    humanize = payload.get("humanize")
    if isinstance(humanize, dict) and humanize:
        fields = ", ".join(humanize.keys())
        print(f"           {paint(t('field.humanize_fields'), 'dim')}: {paint(fields, 'bold')}")


def render_task_status(job: Any) -> None:
    if not isinstance(job, dict):
        render_result(job, t("task.status"))
        return
    status = str(job.get("status", t("common.unknown"))).lower()
    requested, delivered, noun = task_counts(job)
    progress = ""
    if requested is not None and delivered is not None:
        progress = f"{delivered}/{requested} {noun}"
    elif delivered is not None:
        progress = f"{delivered} {noun}"
    bar = f"  {progress_bar(delivered, requested)}" if requested is not None and delivered is not None else ""

    if status == "running":
        log_line("⟳", f"{paint(t('task.running'), 'cyan', 'bold')}  {progress}{bar}".rstrip())
    elif status == "completed":
        log_line("✓", f"{paint(t('task.completed'), 'green', 'bold')} {progress}{bar}".rstrip())
    elif status == "partial":
        log_line("!", f"{paint(t('task.partial'), 'yellow', 'bold')} {progress}{bar}".rstrip())
    elif status in {"failed", "cancelled", "canceled"}:
        status_text = t("task.cancelled") if status in {"cancelled", "canceled"} else t("task.failed")
        log_line("✗", f"{paint(status_text, 'red', 'bold')} {progress}{bar}".rstrip())
    else:
        log_line("•", f"{paint(status if get_language() == 'en' else status, 'bold')} {progress}{bar}".rstrip())

    for key in ("error", "message", "reason", "humanize_failed", "failed"):
        if key in job and job[key] not in (None, "", 0, False):
            print(f"           {pretty_label(key)}: {scalar_text(job[key])}")
