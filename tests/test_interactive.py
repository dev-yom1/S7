from unittest.mock import Mock, patch

from salta7_cli.interactive import choose_store_product, choose_task_product


def test_choose_store_product_uses_prices_list():
    client = Mock()
    client.prices.return_value = [
        {"product": "one", "title": "One", "price": 0.1},
        {"product": "two", "title": "Two", "price": 0.2},
    ]
    with patch("salta7_cli.interactive.select", return_value=1) as picker:
        slug, record = choose_store_product(client)
    assert slug == "two"
    assert record["title"] == "Two"
    options = picker.call_args.args[1]
    assert "Two" in options[1]
    assert "Price 0.2" in options[1]


def test_choose_task_product_supports_wrapped_products_response():
    client = Mock()
    client.task_products.return_value = {
        "products": [
            {"product": "join-basic", "title": "Join Basic", "stock": 20},
        ]
    }
    with patch("salta7_cli.interactive.select", return_value=0):
        slug, _ = choose_task_product(client, "join")
    assert slug == "join-basic"
    client.task_products.assert_called_once_with("join")


def test_yes_no_accepts_korean_and_hindi_yes():
    from salta7_cli.interactive import ask_yes_no

    with patch("builtins.input", return_value="네"):
        assert ask_yes_no("ok?") is True
    with patch("builtins.input", return_value="हाँ"):
        assert ask_yes_no("ok?") is True
