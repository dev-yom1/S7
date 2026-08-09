from unittest.mock import Mock, patch

import requests
import pytest

from salta7_cli.client import CLIError, RetryConfig, Salta7Client


def response(status, payload, headers=None):
    r = Mock(spec=requests.Response)
    r.status_code = status
    r.ok = 200 <= status < 400
    r.headers = headers or {}
    r.json.return_value = payload
    r.text = ""
    return r


def test_auth_header_is_added():
    session = Mock(spec=requests.Session)
    session.headers = {}
    session.request.return_value = response(200, {"balance": 1})
    client = Salta7Client("https://example.test", "secret", session=session)
    client.balance()
    assert session.request.call_args.kwargs["headers"] == {"Authorization": "Bearer secret"}


def test_missing_token_fails_before_request():
    session = Mock(spec=requests.Session)
    session.headers = {}
    client = Salta7Client("https://example.test", None, session=session)
    try:
        client.balance()
    except CLIError as exc:
        assert "requires an API token" in str(exc)
    else:
        raise AssertionError("expected CLIError")
    session.request.assert_not_called()


def test_get_retries_transient_response():
    session = Mock(spec=requests.Session)
    session.headers = {}
    session.request.side_effect = [response(503, {"detail": "busy"}), response(200, [])]
    client = Salta7Client(
        "https://example.test",
        None,
        retry=RetryConfig(attempts=2, base_delay=0),
        session=session,
    )
    with patch("salta7_cli.client.time.sleep"):
        assert client.prices() == []
    assert session.request.call_count == 2


def test_task_create_is_not_retried():
    session = Mock(spec=requests.Session)
    session.headers = {}
    session.request.return_value = response(503, {"detail": "busy"})
    client = Salta7Client(
        "https://example.test",
        "secret",
        retry=RetryConfig(attempts=3, base_delay=0),
        session=session,
    )
    try:
        client.task_create({"tool": "boost"})
    except CLIError:
        pass
    else:
        raise AssertionError("expected CLIError")
    assert session.request.call_count == 1



def test_https_is_required_by_default():
    with pytest.raises(CLIError):
        Salta7Client("http://example.test", "secret")


def test_insecure_http_can_only_be_enabled_for_loopback():
    local = Salta7Client("http://127.0.0.1:8000", "secret", allow_insecure_http=True)
    assert local.base_url == "http://127.0.0.1:8000"
    with pytest.raises(CLIError):
        Salta7Client("http://example.test", "secret", allow_insecure_http=True)


def test_non_positive_timeout_is_rejected():
    with pytest.raises(CLIError):
        Salta7Client("https://example.test", "secret", timeout=0)
