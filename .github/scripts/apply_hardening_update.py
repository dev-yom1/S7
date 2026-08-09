from pathlib import Path

ROOT = Path('.')

def replace(path, old, new, count=1):
    p = ROOT / path
    text = p.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'pattern not found in {path}: {old[:80]!r}')
    text = text.replace(old, new, count)
    p.write_text(text, encoding='utf-8')

# --- client.py: HTTPS enforcement + timeout validation ---
replace('src/salta7_cli/client.py',
'''import time\nfrom dataclasses import dataclass\nfrom email.utils import parsedate_to_datetime\nfrom typing import Any, Dict, Optional\n''',
'''import ipaddress\nimport time\nfrom dataclasses import dataclass\nfrom email.utils import parsedate_to_datetime\nfrom typing import Any, Dict, Optional\nfrom urllib.parse import urlparse\n''')

replace('src/salta7_cli/client.py',
'''RETRYABLE_STATUS = {429, 500, 502, 503, 504}\n\n\nclass CLIError(RuntimeError):\n''',
'''RETRYABLE_STATUS = {429, 500, 502, 503, 504}\n\n\ndef _is_loopback_host(hostname: Optional[str]) -> bool:\n    if not hostname:\n        return False\n    if hostname.lower() == "localhost":\n        return True\n    try:\n        return ipaddress.ip_address(hostname).is_loopback\n    except ValueError:\n        return False\n\n\ndef validate_base_url(base_url: str, *, allow_insecure_http: bool = False) -> str:\n    normalized = base_url.rstrip("/")\n    parsed = urlparse(normalized)\n    if not parsed.scheme or not parsed.hostname:\n        raise CLIError(t("client.base_url_invalid"))\n    if parsed.scheme == "https":\n        return normalized\n    if parsed.scheme == "http":\n        if allow_insecure_http and _is_loopback_host(parsed.hostname):\n            return normalized\n        if allow_insecure_http:\n            raise CLIError(t("client.insecure_http_local_only"))\n        raise CLIError(t("client.https_required"))\n    raise CLIError(t("client.base_url_invalid"))\n\n\nclass CLIError(RuntimeError):\n''')

p = ROOT / 'src/salta7_cli/client.py'
text = p.read_text(encoding='utf-8')
old = '''RETRYABLE_STATUS = {429, 500, 502, 503, 504}\n\n\ndef _is_loopback_host(hostname: Optional[str]) -> bool:\n'''
new = '''RETRYABLE_STATUS = {429, 500, 502, 503, 504}\n\n\nclass CLIError(RuntimeError):\n    """Expected, user-facing CLI error."""\n\n\ndef _is_loopback_host(hostname: Optional[str]) -> bool:\n'''
text = text.replace(old, new, 1)
text = text.replace('''\n\nclass CLIError(RuntimeError):\n    """Expected, user-facing CLI error."""\n\n\n@dataclass(frozen=True)\n''', '''\n\n@dataclass(frozen=True)\n''', 1)
p.write_text(text, encoding='utf-8')

replace('src/salta7_cli/client.py',
'''        retry: RetryConfig = RetryConfig(),\n        session: Optional[requests.Session] = None,\n    ) -> None:\n        self.base_url = base_url.rstrip("/")\n        self.token = token\n        self.timeout = timeout\n''',
'''        retry: RetryConfig = RetryConfig(),\n        session: Optional[requests.Session] = None,\n        allow_insecure_http: bool = False,\n    ) -> None:\n        self.base_url = validate_base_url(base_url, allow_insecure_http=allow_insecure_http)\n        self.token = token\n        if timeout <= 0:\n            raise CLIError(t("error.timeout_positive"))\n        self.timeout = timeout\n''')

# --- output.py: sanitize task error/message/reason values ---
replace('src/salta7_cli/output.py',
'''def render_task_status(job: Any) -> None:\n''',
'''def render_task_status(job: Any, *, reveal_secrets: bool = False) -> None:\n''')
replace('src/salta7_cli/output.py',
'''    for key in ("error", "message", "reason", "humanize_failed", "failed"):\n        if key in job and job[key] not in (None, "", 0, False):\n            print(f"           {pretty_label(key)}: {scalar_text(job[key])}")\n''',
'''    for key in ("error", "message", "reason", "humanize_failed", "failed"):\n        if key in job and job[key] not in (None, "", 0, False):\n            safe_value = sanitize(job[key], reveal_secrets=reveal_secrets, key=key)\n            rendered = (\n                json.dumps(safe_value, ensure_ascii=False, separators=(", ", ": "))\n                if isinstance(safe_value, (dict, list))\n                else scalar_text(safe_value)\n            )\n            print(f"           {pretty_label(key)}: {rendered}")\n''')

# --- i18n extension table ---
replace('src/salta7_cli/i18n.py',
'''from .locale_ko import TRANSLATIONS as KO\n''',
'''from .locale_ko import TRANSLATIONS as KO\nfrom .locale_updates import TRANSLATIONS as UPDATE_TRANSLATIONS\n''')
replace('src/salta7_cli/i18n.py',
'''_TRANSLATIONS: dict[str, dict[str, str]] = {\n    "en": EN,\n    "ja": JA,\n    "ko": KO,\n    "hi": HI,\n}\n''',
'''_TRANSLATIONS: dict[str, dict[str, str]] = {\n    "en": EN,\n    "ja": JA,\n    "ko": KO,\n    "hi": HI,\n}\nfor _language_name, _extra in UPDATE_TRANSLATIONS.items():\n    _TRANSLATIONS[_language_name].update(_extra)\n''')

(ROOT / 'src/salta7_cli/locale_updates.py').write_text(r'''from __future__ import annotations

TRANSLATIONS: dict[str, dict[str, str]] = {
    "en": {
        "help.allow_insecure_http": "Allow plain HTTP only for localhost/loopback development URLs",
        "help.update": "Check for and install a newer S7 release",
        "help.update_check": "Only check whether an update is available",
        "help.update_yes": "Install an available update without asking for confirmation",
        "title.update": "Update",
        "error.timeout_positive": "timeout must be greater than 0.",
        "client.base_url_invalid": "API base URL must include a valid http(s) scheme and host.",
        "client.https_required": "HTTPS is required for API connections. For local development only, use --allow-insecure-http with a loopback URL.",
        "client.insecure_http_local_only": "--allow-insecure-http only permits localhost or loopback IP addresses.",
        "update.no_release": "No published GitHub Release was found yet.",
        "update.up_to_date": "S7 is up to date ({version}).",
        "update.available": "Update available: {current} → {latest}",
        "update.confirm": "Install S7 {latest} now?",
        "update.tty_required": "An update is available. Re-run with --yes to install non-interactively.",
        "update.installing": "Installing S7 {latest}...",
        "update.success": "Updated to S7 {latest}. Restart s7 to use the new version.",
        "update.check_failed": "Could not check for updates: {error}",
        "update.invalid_release": "Latest release tag is not a supported stable version: {tag}",
        "update.install_failed": "Update installation failed with exit code {code}.",
    },
    "ja": {
        "help.allow_insecure_http": "ローカル開発用のlocalhost/loopbackに限りHTTP接続を許可",
        "help.update": "S7の最新版を確認し、更新する",
        "help.update_check": "アップデートの有無だけ確認する",
        "help.update_yes": "確認せず利用可能なアップデートをインストールする",
        "title.update": "アップデート",
        "error.timeout_positive": "timeoutは0より大きい値にしてください。",
        "client.base_url_invalid": "API base URLには有効なhttp(s)スキームとホストが必要です。",
        "client.https_required": "API接続にはHTTPSが必要です。ローカル開発時のみ、loopback URLと--allow-insecure-httpを使用できます。",
        "client.insecure_http_local_only": "--allow-insecure-httpで許可できるのはlocalhostまたはloopback IPだけです。",
        "update.no_release": "公開済みのGitHub Releaseはまだありません。",
        "update.up_to_date": "S7は最新版です（{version}）。",
        "update.available": "アップデートがあります: {current} → {latest}",
        "update.confirm": "S7 {latest}へアップデートしますか？",
        "update.tty_required": "アップデートがあります。非対話環境では--yesを付けて再実行してください。",
        "update.installing": "S7 {latest}をインストールしています...",
        "update.success": "S7 {latest}へ更新しました。新しいバージョンを使うにはs7を再起動してください。",
        "update.check_failed": "アップデートを確認できませんでした: {error}",
        "update.invalid_release": "最新Releaseのタグが対応する安定版形式ではありません: {tag}",
        "update.install_failed": "アップデートのインストールに失敗しました（終了コード {code}）。",
    },
    "ko": {
        "help.allow_insecure_http": "로컬 개발용 localhost/loopback에 한해 HTTP 연결 허용",
        "help.update": "S7 최신 릴리스를 확인하고 업데이트",
        "help.update_check": "업데이트 가능 여부만 확인",
        "help.update_yes": "확인 없이 사용 가능한 업데이트 설치",
        "title.update": "업데이트",
        "error.timeout_positive": "timeout은 0보다 커야 합니다.",
        "client.base_url_invalid": "API base URL에는 올바른 http(s) 스킴과 호스트가 필요합니다.",
        "client.https_required": "API 연결에는 HTTPS가 필요합니다. 로컬 개발에서만 loopback URL과 --allow-insecure-http를 사용할 수 있습니다.",
        "client.insecure_http_local_only": "--allow-insecure-http는 localhost 또는 loopback IP만 허용합니다.",
        "update.no_release": "아직 공개된 GitHub Release가 없습니다.",
        "update.up_to_date": "S7은 최신 버전입니다 ({version}).",
        "update.available": "업데이트 가능: {current} → {latest}",
        "update.confirm": "지금 S7 {latest}을(를) 설치할까요?",
        "update.tty_required": "업데이트가 있습니다. 비대화형 환경에서는 --yes로 다시 실행하세요.",
        "update.installing": "S7 {latest} 설치 중...",
        "update.success": "S7 {latest}으로 업데이트했습니다. 새 버전을 사용하려면 s7을 다시 시작하세요.",
        "update.check_failed": "업데이트 확인 실패: {error}",
        "update.invalid_release": "최신 Release 태그가 지원되는 안정 버전 형식이 아닙니다: {tag}",
        "update.install_failed": "업데이트 설치 실패 (종료 코드 {code}).",
    },
    "hi": {
        "help.allow_insecure_http": "केवल local development के localhost/loopback URL के लिए HTTP अनुमति दें",
        "help.update": "S7 का नया release जांचें और update करें",
        "help.update_check": "केवल देखें कि update उपलब्ध है या नहीं",
        "help.update_yes": "पुष्टि के बिना उपलब्ध update install करें",
        "title.update": "अपडेट",
        "error.timeout_positive": "timeout 0 से बड़ा होना चाहिए।",
        "client.base_url_invalid": "API base URL में valid http(s) scheme और host होना चाहिए।",
        "client.https_required": "API connections के लिए HTTPS आवश्यक है। Local development में ही loopback URL के साथ --allow-insecure-http इस्तेमाल करें।",
        "client.insecure_http_local_only": "--allow-insecure-http केवल localhost या loopback IP को अनुमति देता है।",
        "update.no_release": "अभी कोई published GitHub Release नहीं मिला।",
        "update.up_to_date": "S7 नवीनतम संस्करण पर है ({version})।",
        "update.available": "Update उपलब्ध: {current} → {latest}",
        "update.confirm": "क्या अभी S7 {latest} install करें?",
        "update.tty_required": "Update उपलब्ध है। Non-interactive mode में --yes के साथ फिर चलाएँ।",
        "update.installing": "S7 {latest} install हो रहा है...",
        "update.success": "S7 {latest} पर update हो गया। नया version उपयोग करने के लिए s7 restart करें।",
        "update.check_failed": "Update check नहीं हो सका: {error}",
        "update.invalid_release": "Latest Release tag supported stable version format में नहीं है: {tag}",
        "update.install_failed": "Update installation विफल रहा (exit code {code})।",
    },
}
''', encoding='utf-8')

(ROOT / 'src/salta7_cli/updater.py').write_text(r'''from __future__ import annotations

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
''', encoding='utf-8')

replace('src/salta7_cli/cli.py',
'''from .utils import ensure_range, load_tokens, token_file_permissions_warning\n''',
'''from .updater import check_for_update, install_update\nfrom .utils import ensure_range, load_tokens, token_file_permissions_warning\n''')
replace('src/salta7_cli/cli.py',
'''    parser.add_argument("--base-url", default=os.getenv("SALTA7_BASE_URL", DEFAULT_BASE_URL), help=t("help.base_url"))\n    parser.add_argument("--token", default=os.getenv("SALTA7_TOKEN"), help=t("help.token"))\n''',
'''    parser.add_argument("--base-url", default=os.getenv("SALTA7_BASE_URL", DEFAULT_BASE_URL), help=t("help.base_url"))\n    parser.add_argument(\n        "--allow-insecure-http",\n        action="store_true",\n        help=t("help.allow_insecure_http"),\n    )\n    parser.add_argument("--token", default=os.getenv("SALTA7_TOKEN"), help=t("help.token"))\n''')
replace('src/salta7_cli/cli.py',
'''    sub.add_parser("prices", help=t("help.prices"))\n\n    p = sub.add_parser("stock", help=t("help.stock"))\n''',
'''    sub.add_parser("prices", help=t("help.prices"))\n    p = sub.add_parser("update", help=t("help.update"))\n    p.add_argument("--check", action="store_true", help=t("help.update_check"))\n    p.add_argument("-y", "--yes", action="store_true", help=t("help.update_yes"))\n\n    p = sub.add_parser("stock", help=t("help.stock"))\n''')
replace('src/salta7_cli/cli.py',
'''    jsonl: bool,\n    heartbeat: float = 60.0,\n) -> Any:\n''',
'''    jsonl: bool,\n    reveal_secrets: bool = False,\n    heartbeat: float = 60.0,\n) -> Any:\n''')
replace('src/salta7_cli/cli.py',
'''                render_task_status(job)\n''',
'''                render_task_status(job, reveal_secrets=reveal_secrets)\n''')
replace('src/salta7_cli/cli.py',
'''                jsonl=args.jsonl,\n            )\n''',
'''                jsonl=args.jsonl,\n                reveal_secrets=args.reveal_secrets,\n            )\n''', count=1)
replace('src/salta7_cli/cli.py',
'''    retry_attempts = max(1, args.retries)\n    client = Salta7Client(args.base_url, args.token, args.timeout, retry=RetryConfig(attempts=retry_attempts))\n\n    if not args.command:\n''',
'''    retry_attempts = max(1, args.retries)\n    try:\n        client = Salta7Client(\n            args.base_url,\n            args.token,\n            args.timeout,\n            retry=RetryConfig(attempts=retry_attempts),\n            allow_insecure_http=args.allow_insecure_http,\n        )\n    except CLIError as exc:\n        log_line("✗", f"{paint(t('common.error'), 'red', 'bold')}: {exc}", stream=sys.stderr)\n        return 1\n\n    if not args.command:\n''')
replace('src/salta7_cli/cli.py',
'''        "prices": t("title.prices"),\n        "stock": t("title.stock"),\n''',
'''        "prices": t("title.prices"),\n        "update": t("title.update"),\n        "stock": t("title.stock"),\n''')
replace('src/salta7_cli/cli.py',
'''        if args.command == "prices":\n            output(client.prices(), t("title.prices"))\n            return 0\n        if args.command == "stock":\n''',
'''        if args.command == "prices":\n            output(client.prices(), t("title.prices"))\n            return 0\n        if args.command == "update":\n            info = check_for_update(__version__)\n            if json_mode:\n                output(info, t("title.update"))\n            elif not info.get("release_found"):\n                log_line("•", t("update.no_release"))\n            elif info.get("update_available"):\n                log_line("!", t("update.available", current=__version__, latest=info["latest_version"]))\n            else:\n                log_line("✓", t("update.up_to_date", version=__version__))\n\n            if args.check or not info.get("update_available"):\n                return 0\n            if not args.yes:\n                if not sys.stdin.isatty():\n                    raise CLIError(t("update.tty_required"))\n                answer = input(t("update.confirm", latest=info["latest_version"]) + " [y/N]: ").strip().lower()\n                if answer not in {"y", "yes", "はい", "h", "예", "네", "हाँ", "हां"}:\n                    return 0\n            if not json_mode:\n                log_line("⟳", t("update.installing", latest=info["latest_version"]))\n            install_update(str(info["tag_name"]))\n            if not json_mode:\n                log_line("✓", t("update.success", latest=info["latest_version"]))\n            return 0\n        if args.command == "stock":\n''')
replace('src/salta7_cli/cli.py',
'''                output(job, t("title.task_status")) if json_mode else render_task_status(job)\n''',
'''                output(job, t("title.task_status")) if json_mode else render_task_status(job, reveal_secrets=args.reveal_secrets)\n''')
needle = '''                    compact=args.compact,\n                    jsonl=args.jsonl,\n                )\n'''
p = ROOT / 'src/salta7_cli/cli.py'
text = p.read_text(encoding='utf-8')
text = text.replace(needle, '''                    compact=args.compact,\n                    jsonl=args.jsonl,\n                    reveal_secrets=args.reveal_secrets,\n                )\n''')
p.write_text(text, encoding='utf-8')

with (ROOT / 'tests/test_client.py').open('a', encoding='utf-8') as f:
    f.write(r'''


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
''')
p = ROOT / 'tests/test_client.py'
text = p.read_text(encoding='utf-8')
if 'import pytest\n' not in text:
    text = text.replace('import requests\n', 'import requests\nimport pytest\n', 1)
p.write_text(text, encoding='utf-8')

with (ROOT / 'tests/test_output.py').open('a', encoding='utf-8') as f:
    f.write(r'''


def test_task_status_masks_nested_secret_in_error(capsys):
    from salta7_cli.output import render_task_status

    render_task_status({"status": "failed", "error": {"token": "supersecret-token-value", "reason": "bad"}})
    out = capsys.readouterr().out
    assert "supersecret-token-value" not in out
    assert "sup…lue" in out
    assert "bad" in out


def test_task_status_reveal_secrets_is_explicit(capsys):
    from salta7_cli.output import render_task_status

    render_task_status(
        {"status": "failed", "error": {"token": "supersecret-token-value"}},
        reveal_secrets=True,
    )
    assert "supersecret-token-value" in capsys.readouterr().out
''')

with (ROOT / 'tests/test_cli.py').open('a', encoding='utf-8') as f:
    f.write(r'''


def test_parser_supports_update_and_insecure_http_flag():
    parser = build_parser()
    args = parser.parse_args(["--allow-insecure-http", "update", "--check"])
    assert args.allow_insecure_http is True
    assert args.command == "update"
    assert args.check is True
''')

(ROOT / 'tests/test_updater.py').write_text(r'''from unittest.mock import Mock

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
''', encoding='utf-8')

sections = {
    'README.md': '''## Updating S7\n\nCheck whether a newer published GitHub Release is available:\n\n```bash\ns7 update --check\n```\n\nIf an update is available, install it with:\n\n```bash\ns7 update\n```\n\nIn non-interactive environments, use `s7 update --yes`. S7 installs only stable version tags from this repository and uses HTTPS. If no GitHub Release has been published yet, the command exits normally and reports that there is no release.\n\n''',
    'README.ja.md': '''## S7のアップデート\n\n公開済みGitHub Releaseに新しいバージョンがあるか確認できます。\n\n```bash\ns7 update --check\n```\n\nアップデートがある場合は、次で簡単に更新できます。\n\n```bash\ns7 update\n```\n\n非対話環境では `s7 update --yes` を使用します。S7はこのリポジトリの安定版version tagだけをHTTPS経由でインストールします。まだGitHub Releaseが公開されていない場合はエラーにせず、その旨を表示して終了します。\n\n''',
    'README.ko.md': '''## S7 업데이트\n\n게시된 GitHub Release에 새 버전이 있는지 확인할 수 있습니다.\n\n```bash\ns7 update --check\n```\n\n업데이트가 있으면 다음 명령으로 설치할 수 있습니다.\n\n```bash\ns7 update\n```\n\n비대화형 환경에서는 `s7 update --yes`를 사용합니다. S7은 이 저장소의 안정 버전 tag만 HTTPS를 통해 설치합니다. 아직 GitHub Release가 없다면 오류로 처리하지 않고 안내 후 종료합니다.\n\n''',
    'README.hi.md': '''## S7 अपडेट करना\n\nPublished GitHub Release में नया version उपलब्ध है या नहीं, यह जांचें:\n\n```bash\ns7 update --check\n```\n\nUpdate उपलब्ध होने पर इसे आसानी से install करें:\n\n```bash\ns7 update\n```\n\nNon-interactive environment में `s7 update --yes` इस्तेमाल करें। S7 केवल इसी repository के stable version tags को HTTPS से install करता है। यदि अभी कोई GitHub Release publish नहीं हुआ है, command सामान्य रूप से जानकारी देकर exit करता है।\n\n''',
}
for filename, section in sections.items():
    p = ROOT / filename
    text = p.read_text(encoding='utf-8')
    if section.splitlines()[0] in text:
        continue
    markers = {
        'README.md': '## Diagnostics\n',
        'README.ja.md': '## 診断\n',
        'README.ko.md': '## 진단\n',
        'README.hi.md': '## Diagnostics\n',
    }
    marker = markers[filename]
    if marker not in text:
        candidates = ['## Account & wallet commands\n', '## アカウント・ウォレット系コマンド\n', '## 계정 및 지갑 명령\n', '## Account और wallet commands\n']
        marker = next((m for m in candidates if m in text), None)
    if marker:
        text = text.replace(marker, section + marker, 1)
    else:
        text += '\n' + section
    p.write_text(text, encoding='utf-8')

p = ROOT / 'SECURITY.md'
text = p.read_text(encoding='utf-8')
security_note = '''\n## Transport security\n\nS7 requires HTTPS for API base URLs. Plain HTTP is only available for explicit local development with `--allow-insecure-http`, and even then only for localhost/loopback addresses. Never send API tokens over plain HTTP to remote hosts.\n'''
if '## Transport security' not in text:
    text += security_note
    p.write_text(text, encoding='utf-8')
