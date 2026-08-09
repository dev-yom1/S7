import pytest

from salta7_cli.client import CLIError
from salta7_cli.utils import ensure_range, validate_humanize


def test_ensure_range():
    ensure_range(5, 1, 10, "value")
    with pytest.raises(CLIError):
        ensure_range(11, 1, 10, "value")


def test_humanize_banner_random_rejected():
    with pytest.raises(CLIError):
        validate_humanize({"banner": {"source": "random"}})


def test_humanize_valid_random_name():
    validate_humanize({"name": {"source": "random"}})
