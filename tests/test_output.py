from salta7_cli.output import _display_width, progress_bar, render_result, sanitize, task_signature


def test_sanitize_masks_token_fields():
    data = {"token": "abcdefghijklmnop", "name": "leo", "nested": {"password": "secret123"}}
    safe = sanitize(data)
    assert safe["token"] != data["token"]
    assert safe["nested"]["password"] != "secret123"
    assert safe["name"] == "leo"


def test_sanitize_reveal_secrets():
    data = {"token": "abcdefghijklmnop"}
    assert sanitize(data, reveal_secrets=True) == data


def test_progress_bar_length_without_color():
    bar = progress_bar(5, 10, width=10)
    assert len(bar) == 10
    assert bar.count("█") == 5


def test_task_signature_changes_with_progress():
    a = {"status": "running", "boosts_requested": 14, "boosts_delivered": 2}
    b = {"status": "running", "boosts_requested": 14, "boosts_delivered": 4}
    assert task_signature(a) != task_signature(b)


def test_list_records_render_as_cards_and_skip_empty_fields(capsys):
    render_result(
        [
            {
                "product": "discord-1m-nitro",
                "price": 0.34,
                "title": "Discord 1M Nitro",
                "id": 6,
                "description": "Hotmail / Outlook Tokens",
                "warranty": "2-Day Warranty",
                "details": "",
                "format": "Email:Pass:Token",
                "admin_only": "no",
            }
        ],
        "Prices",
    )
    out = capsys.readouterr().out
    assert "1. Discord 1M Nitro" in out
    assert "Product" in out and "discord-1m-nitro" in out
    assert "Price" in out and "0.34" in out
    assert "Format" in out and "Email:Pass:Token" in out
    assert "Details" not in out
    assert "Product=discord-1m-nitro, Price=0.34" not in out


def test_nested_record_lists_render_as_cards(capsys):
    render_result(
        {"products": [{"title": "One", "product": "one", "price": 0.1}]},
        "Result",
    )
    out = capsys.readouterr().out
    assert "Products" in out
    assert "1. One" in out
    assert "Product=one" not in out


def test_display_width_handles_korean_and_devanagari():
    assert _display_width("가격") == 4
    assert _display_width("कि") == 1
