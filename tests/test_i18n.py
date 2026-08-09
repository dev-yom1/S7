import pytest

from salta7_cli.cli import build_parser
from salta7_cli.i18n import detect_language, get_language, set_language, t
from salta7_cli.output import render_result


@pytest.fixture(autouse=True)
def reset_language():
    set_language("en")
    yield
    set_language("en")


def test_explicit_japanese_translation():
    set_language("ja")
    assert get_language() == "ja"
    assert t("task.completed") == "完了"
    assert t("field.price") == "価格"


def test_detect_language_from_salta7_lang(monkeypatch):
    monkeypatch.setenv("SALTA7_LANG", "ja_JP.UTF-8")
    assert detect_language() == "ja"


def test_detect_language_falls_back_to_english(monkeypatch):
    for name in ("SALTA7_LANG", "LC_ALL", "LC_MESSAGES", "LANG"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setattr("salta7_cli.i18n.locale.getlocale", lambda: (None, None))
    assert detect_language() == "en"


def test_japanese_parser_help():
    parser = build_parser("ja")
    help_text = parser.format_help()
    assert "Salta7 Store API 用CLIクライアント" in help_text
    assert "UI言語" in help_text
    assert "商品と価格を一覧表示" in help_text


def test_japanese_product_card_labels(capsys):
    set_language("ja")
    render_result(
        [{"product": "discord-1m-nitro", "title": "Discord 1M Nitro", "price": 0.34, "stock": 12}],
        t("title.prices"),
    )
    out = capsys.readouterr().out
    assert "商品・価格一覧" in out
    assert "商品" in out
    assert "価格" in out
    assert "在庫" in out
    assert "Product" not in out


def test_explicit_korean_translation():
    set_language("ko")
    assert get_language() == "ko"
    assert t("task.completed") == "완료"
    assert t("field.price") == "가격"


def test_explicit_hindi_translation():
    set_language("hi")
    assert get_language() == "hi"
    assert t("task.completed") == "पूरा हुआ"
    assert t("field.price") == "कीमत"


def test_detect_korean_and_hindi_locales(monkeypatch):
    monkeypatch.setenv("SALTA7_LANG", "ko_KR.UTF-8")
    assert detect_language() == "ko"
    monkeypatch.setenv("SALTA7_LANG", "hi_IN.UTF-8")
    assert detect_language() == "hi"


def test_all_languages_have_complete_key_coverage():
    from salta7_cli.i18n import SUPPORTED_LANGUAGES, _TRANSLATIONS

    expected = set(_TRANSLATIONS["en"])
    for language in SUPPORTED_LANGUAGES:
        assert set(_TRANSLATIONS[language]) == expected


def test_all_translation_placeholders_match_english():
    import string

    from salta7_cli.i18n import SUPPORTED_LANGUAGES, _TRANSLATIONS

    formatter = string.Formatter()

    def fields(text: str) -> set[str]:
        return {name for _, name, _, _ in formatter.parse(text) if name}

    for language in SUPPORTED_LANGUAGES:
        for key, english in _TRANSLATIONS["en"].items():
            assert fields(_TRANSLATIONS[language][key]) == fields(english), (language, key)


def test_korean_and_hindi_parser_help():
    korean = build_parser("ko").format_help()
    assert "Salta7 Store API용 CLI 클라이언트" in korean
    assert "UI 언어" in korean

    hindi = build_parser("hi").format_help()
    assert "Salta7 Store API के लिए CLI क्लाइंट" in hindi
    assert "UI भाषा" in hindi
