from salta7_cli.cli import build_parser


def test_parser_supports_jsonl_watch():
    parser = build_parser()
    args = parser.parse_args(["--jsonl", "task", "status", "job-1", "--watch"])
    assert args.jsonl is True
    assert args.watch is True
    assert args.job_id == "job-1"


def test_parser_supports_menu_and_doctor():
    parser = build_parser()
    assert parser.parse_args(["menu"]).command == "menu"
    assert parser.parse_args(["doctor"]).command == "doctor"


def test_parser_allows_interactive_stock_and_buy_selection():
    parser = build_parser()
    stock = parser.parse_args(["stock"])
    buy = parser.parse_args(["buy"])
    assert stock.account is None
    assert buy.account is None
    assert buy.amount is None


def test_parser_supports_cli_friendly_humanize_flags():
    parser = build_parser()
    args = parser.parse_args(
        [
            "task",
            "humanize",
            "--mode",
            "stock",
            "--quantity",
            "3",
            "--random-avatar",
            "--name",
            "Leo",
            "--hypesquad",
            "balance",
        ]
    )
    assert args.random_avatar is True
    assert args.name == "Leo"
    assert args.hypesquad == "balance"
