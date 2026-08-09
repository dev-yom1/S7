from unittest.mock import Mock

import pytest

from salta7_cli.client import CLIError
from salta7_cli.updater import check_for_update, install_update


def _response(status, payload=None):
    response = Mock()
    response.status_code = status
    response.ok = 200 <= status < 300
    response.json.return_value = payload or {}
    return response


def test_no_release_is_not_an_error():
    session = Mock()
    session.get.return_value = _response(404)
    info = check_for_update("2.4.0", session=session)
    assert info["release_found"] is False
    assert info["update_available"] is False


def test_update_available_from_github_release():
    session = Mock()
    session.get.return_value = _response(200, {"tag_name": "v2.5.0", "html_url": "https://github.com/dev-yom1/S7/releases/tag/v2.5.0"})
    info = check_for_update("2.4.0", session=session)
    assert info["update_available"] is True
    assert info["latest_version"] == "2.5.0"


def test_invalid_release_tag_is_rejected():
    session = Mock()
    session.get.return_value = _response(200, {"tag_name": "latest;rm-rf"})
    with pytest.raises(CLIError):
        check_for_update("2.4.0", session=session)


def test_installer_uses_argument_list_without_shell():
    runner = Mock()
    runner.return_value.returncode = 0
    install_update("v2.5.0", runner=runner, python_executable="python")
    args = runner.call_args.args[0]
    assert args[:4] == ["python", "-m", "pip", "install"]
    assert args[-1].endswith("/v2.5.0.zip")
    assert runner.call_args.kwargs["check"] is False
