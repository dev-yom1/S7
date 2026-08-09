from __future__ import annotations

import re
import subprocess
import sys
from typing import Any, Optional

import requests

from .client import CLIError
from .i18n import t

LATEST_RELEASE_URL = "https://api.github.com/repos/dev-yom1/S7/releases/latest"
_RELEASE_RE = re.compile(r"^v?(\d+)\.(\d+)\.(\d+)$")


def _version_tuple(value: str) -> tuple[int, int, int]:
    match = _RELEASE_RE.fullmatch(value.strip())
    if not match:
        raise CLIError(t("update.invalid_release", tag=value))
    return tuple(int(part) for part in match.groups())


def check_for_update(current_version: str, *, session: Optional[requests.Session] = None, timeout: float = 10.0) -> dict[str, Any]:
    client = session or requests.Session()
    try:
        response = client.get(
            LATEST_RELEASE_URL,
            headers={"Accept": "application/vnd.github+json", "User-Agent": f"salta7-cli/{current_version}"},
            timeout=timeout,
        )
    except requests.RequestException as exc:
        raise CLIError(t("update.check_failed", error=exc)) from exc

    if response.status_code == 404:
        return {"release_found": False, "current_version": current_version, "update_available": False}
    if not response.ok:
        raise CLIError(t("update.check_failed", error=f"HTTP {response.status_code}"))
    try:
        payload = response.json()
    except ValueError as exc:
        raise CLIError(t("update.check_failed", error="invalid GitHub response")) from exc

    tag = str(payload.get("tag_name") or "").strip()
    latest_tuple = _version_tuple(tag)
    current_tuple = _version_tuple(current_version)
    latest_version = ".".join(str(part) for part in latest_tuple)
    return {
        "release_found": True,
        "current_version": current_version,
        "latest_version": latest_version,
        "tag_name": tag,
        "release_url": payload.get("html_url"),
        "update_available": latest_tuple > current_tuple,
    }


def install_update(tag_name: str, *, runner=subprocess.run, python_executable: str = sys.executable) -> None:
    _version_tuple(tag_name)
    source_url = f"https://github.com/dev-yom1/S7/archive/refs/tags/{tag_name}.zip"
    try:
        result = runner(
            [python_executable, "-m", "pip", "install", "--disable-pip-version-check", "--upgrade", source_url],
            check=False,
        )
    except OSError as exc:
        raise CLIError(t("update.install_failed", code=str(exc))) from exc
    if result.returncode != 0:
        raise CLIError(t("update.install_failed", code=result.returncode))
