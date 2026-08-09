from __future__ import annotations

import base64
import mimetypes
from pathlib import Path
from typing import Any, Mapping, Optional

from .client import CLIError
from .i18n import t
from .utils import load_json_value, validate_humanize

RANDOM_FIELDS = ("avatar", "name", "bio", "pronouns", "hypesquad")
HYPESQUAD_ALIASES = {
    "1": "1",
    "bravery": "1",
    "2": "2",
    "brilliance": "2",
    "3": "3",
    "balance": "3",
}


def image_file_to_data_url(path: str) -> str:
    file_path = Path(path).expanduser()
    if not file_path.is_file():
        raise CLIError(t("humanize.image_not_found", path=file_path))
    mime, _ = mimetypes.guess_type(file_path.name)
    if not mime or not mime.startswith("image/"):
        raise CLIError(t("humanize.image_type", path=file_path))
    encoded = base64.b64encode(file_path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def normalize_hypesquad(value: str) -> str:
    normalized = HYPESQUAD_ALIASES.get(str(value).strip().lower())
    if normalized is None:
        raise CLIError(t("utils.hypesquad_value"))
    return normalized


def build_humanize_config(values: Mapping[str, Any], *, required: bool = False) -> Optional[dict[str, Any]]:
    """Build the API Humanize object from CLI-friendly options.

    Legacy --humanize-json is used as a base. Explicit CLI flags override the
    matching fields, while --random-all fills every random-capable field.
    """

    config = dict(load_json_value(values.get("humanize_json")) or {})

    if values.get("random_all"):
        for field in RANDOM_FIELDS:
            config[field] = {"source": "random"}

    if values.get("random_avatar"):
        config["avatar"] = {"source": "random"}
    elif values.get("avatar_url"):
        avatar_url = str(values["avatar_url"]).strip()
        if not avatar_url.startswith(("http://", "https://", "data:image/")):
            raise CLIError(t("humanize.avatar_url_invalid"))
        config["avatar"] = {"source": "custom", "value": avatar_url}
    elif values.get("avatar_file"):
        config["avatar"] = {"source": "custom", "value": image_file_to_data_url(values["avatar_file"])}

    if values.get("banner_file"):
        config["banner"] = {"source": "custom", "value": image_file_to_data_url(values["banner_file"])}
    elif values.get("banner_data"):
        banner_data = str(values["banner_data"]).strip()
        if not banner_data.startswith("data:image/"):
            raise CLIError(t("humanize.banner_data_invalid"))
        config["banner"] = {"source": "custom", "value": banner_data}

    for field in ("name", "bio", "pronouns"):
        if values.get(f"random_{field}"):
            config[field] = {"source": "random"}
        elif values.get(field) is not None:
            config[field] = {"source": "custom", "value": values[field]}

    if values.get("random_hypesquad"):
        config["hypesquad"] = {"source": "random"}
    elif values.get("hypesquad") is not None:
        config["hypesquad"] = {"source": "custom", "value": normalize_hypesquad(values["hypesquad"])}

    if not config:
        if required:
            raise CLIError(t("humanize.required"))
        return None

    validate_humanize(config)
    return config
