from pathlib import Path

import pytest

from salta7_cli.client import CLIError
from salta7_cli.humanize import build_humanize_config, image_file_to_data_url


def test_random_all_builds_supported_random_fields():
    result = build_humanize_config({"random_all": True}, required=True)
    assert result == {
        "avatar": {"source": "random"},
        "name": {"source": "random"},
        "bio": {"source": "random"},
        "pronouns": {"source": "random"},
        "hypesquad": {"source": "random"},
    }
    assert "banner" not in result


def test_explicit_custom_values_override_random_all():
    result = build_humanize_config(
        {
            "random_all": True,
            "name": "Leo",
            "hypesquad": "balance",
        },
        required=True,
    )
    assert result["name"] == {"source": "custom", "value": "Leo"}
    assert result["hypesquad"] == {"source": "custom", "value": "3"}
    assert result["avatar"] == {"source": "random"}


def test_image_file_is_converted_to_data_url(tmp_path: Path):
    image = tmp_path / "avatar.png"
    image.write_bytes(b"\x89PNG\r\n\x1a\n")
    result = image_file_to_data_url(str(image))
    assert result.startswith("data:image/png;base64,")


def test_humanize_requires_a_field_when_requested():
    with pytest.raises(CLIError):
        build_humanize_config({}, required=True)


def test_banner_data_must_be_data_image_url():
    with pytest.raises(CLIError):
        build_humanize_config({"banner_data": "https://example.com/banner.png"}, required=True)
