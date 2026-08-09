from __future__ import annotations

import argparse
import os
import sys
import time
import uuid
from typing import Any, Dict, Iterable, Optional

from . import __version__
from .client import CLIError, DEFAULT_BASE_URL, DEFAULT_TIMEOUT, RetryConfig, Salta7Client
from .humanize import build_humanize_config
from .i18n import SUPPORTED_LANGUAGES, set_language, t
from .interactive import ask_int, choose_store_product, choose_task_product, interactive_main, run_doctor
from .output import (
    command_banner,
    configure_color,
    full_logo,
    log_line,
    paint,
    print_json,
    print_jsonl,
    render_result,
    render_task_created,
    render_task_status,
    task_signature,
)
from .utils import ensure_range, load_tokens, token_file_permissions_warning

APP_NAME = "Salta7 CLI"
COMMAND_NAME = "s7"
TERMINAL_STATUSES = {"completed", "partial", "failed", "cancelled", "canceled"}


class LocalizedArgumentParser(argparse.ArgumentParser):
    def format_help(self) -> str:
        self._positionals.title = t("argparse.positional")
        self._optionals.title = t("argparse.options")
        text = super().format_help()
        if t("argparse.usage") != "usage:":
            text = text.replace("usage:", t("argparse.usage"), 1)
        return text

    def format_usage(self) -> str:
        text = super().format_usage()
        if t("argparse.usage") != "usage:":
            text = text.replace("usage:", t("argparse.usage"), 1)
        return text


def add_wait_options(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--wait", action="store_true", help=t("help.wait"))
    parser.add_argument("--interval", type=float, default=10.0, help=t("help.interval"))


def add_humanize_options(parser: argparse.ArgumentParser) -> None:
    group = parser.add_argument_group(t("help.humanize_group"))
    group.add_argument("--random-all", action="store_true", help=t("help.random_all"))

    avatar = group.add_mutually_exclusive_group()
    avatar.add_argument("--random-avatar", action="store_true", help=t("help.random_avatar"))
    avatar.add_argument("--avatar-url", help=t("help.avatar_url"))
    avatar.add_argument("--avatar-file", help=t("help.avatar_file"))

    banner = group.add_mutually_exclusive_group()
    banner.add_argument("--banner-file", help=t("help.banner_file"))
    banner.add_argument("--banner-data", help=t("help.banner_data"))

    name = group.add_mutually_exclusive_group()
    name.add_argument("--random-name", action="store_true", help=t("help.random_name"))
    name.add_argument("--name", help=t("help.humanize_name"))

    bio = group.add_mutually_exclusive_group()
    bio.add_argument("--random-bio", action="store_true", help=t("help.random_bio"))
    bio.add_argument("--bio", help=t("help.humanize_bio"))

    pronouns = group.add_mutually_exclusive_group()
    pronouns.add_argument("--random-pronouns", action="store_true", help=t("help.random_pronouns"))
    pronouns.add_argument("--pronouns", help=t("help.humanize_pronouns"))

    hypesquad = group.add_mutually_exclusive_group()
    hypesquad.add_argument("--random-hypesquad", action="store_true", help=t("help.random_hypesquad"))
    hypesquad.add_argument(
        "--hypesquad",
        choices=["1", "2", "3", "bravery", "brilliance", "balance"],
        help=t("help.hypesquad"),
    )

    group.add_argument(
        "--humanize-json",
        help=t("help.humanize_json_legacy", example='{"name":{"source":"random"}}'),
    )


def build_parser(language: Optional[str] = None) -> argparse.ArgumentParser:
    if language is not None:
        set_language(language)
    parser = LocalizedArgumentParser(
        prog=COMMAND_NAME,
        description=f"{APP_NAME} — {t('app.description')}",
        add_help=False,
    )
    parser.add_argument("-h", "--help", action="help", help=t("argparse.help"))
    parser.add_argument(
        "--lang",
        choices=["auto", *SUPPORTED_LANGUAGES],
        default="auto",
        help=t("help.lang", languages=", ".join(("auto", *SUPPORTED_LANGUAGES))),
    )
    parser.add_argument("--base-url", default=os.getenv("SALTA7_BASE_URL", DEFAULT_BASE_URL), help=t("help.base_url"))
    parser.add_argument("--token", default=os.getenv("SALTA7_TOKEN"), help=t("help.token"))
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT, help=t("help.timeout"))
    parser.add_argument("--retries", type=int, default=3, help=t("help.retries"))
    parser.add_argument("--json", action="store_true", help=t("help.json"))
    parser.add_argument("--jsonl", action="store_true", help=t("help.jsonl"))
    parser.add_argument("--compact", action="store_true", help=t("help.compact"))
    parser.add_argument("--no-color", action="store_true", help=t("help.no_color"))
    parser.add_argument("--reveal-secrets", action="store_true", help=t("help.reveal"))
    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
        help=t("argparse.version"),
    )

    sub = parser.add_subparsers(dest="command")
    sub.add_parser("menu", help=t("help.menu"))
    sub.add_parser("doctor", help=t("help.doctor"))
    sub.add_parser("prices", help=t("help.prices"))

    p = sub.add_parser("stock", help=t("help.stock"))
    p.add_argument("account", nargs="?", help=t("help.stock_account"))

    sub.add_parser("balance", help=t("help.balance"))

    p = sub.add_parser("buy", help=t("help.buy"))
    p.add_argument("account", nargs="?", help=t("help.buy_account"))
    p.add_argument("amount", nargs="?", type=int, help=t("help.buy_amount"))
    p.add_argument("--client-tx-id", help=t("help.client_tx"))
    p.add_argument("-y", "--yes", action="store_true", help=t("help.yes"))

    sub.add_parser("history", help=t("help.history"))
    p = sub.add_parser("history-items", help=t("help.history_items"))
    p.add_argument("tx_id")

    task = sub.add_parser("task", help=t("help.task"))
    tsub = task.add_subparsers(dest="task_command", required=True)
    tsub.add_parser("quote", help=t("help.quote"))
    p = tsub.add_parser("products", help=t("help.products"))
    p.add_argument("--tool", choices=["join", "humanize"], help=t("help.tool_filter"))
    tsub.add_parser("active", help=t("help.active"))

    p = tsub.add_parser("status", help=t("help.status"))
    p.add_argument("job_id")
    p.add_argument("--watch", action="store_true", help=t("help.watch"))
    p.add_argument("--interval", type=float, default=10.0, help=t("help.interval"))

    p = tsub.add_parser("history", help=t("help.task_history"))
    p.add_argument("--tool", choices=["boost", "join", "humanize"])
    p.add_argument("--limit", type=int, default=10)

    p = tsub.add_parser("items", help=t("help.items"))
    p.add_argument("job_id")
    p.add_argument("--byot", action="store_true", help=t("help.byot_items"))

    p = tsub.add_parser("byot-quote", help=t("help.byot_quote"))
    p.add_argument("--tokens-file", required=True, help=t("help.tokens_file_rows"))
    p.add_argument("--boosts-needed", type=int, default=0)
    p.add_argument("--humanize", action="store_true")

    p = tsub.add_parser("boost", help=t("help.create_boost"))
    p.add_argument("--mode", choices=["stock", "byot"], default="stock")
    p.add_argument("--invite", required=True)
    p.add_argument("--boosts", type=int, help=t("help.boosts_stock"))
    p.add_argument("--tokens-file", help=t("help.tokens_one"))
    p.add_argument("--boosts-needed", type=int, default=0, help=t("help.boosts_needed"))
    add_humanize_options(p)
    add_wait_options(p)

    p = tsub.add_parser("join", help=t("help.create_join"))
    p.add_argument("--mode", choices=["stock", "byot"], default="stock")
    p.add_argument("--invite", required=True)
    p.add_argument("--product", help=t("help.product_task"))
    p.add_argument("--quantity", type=int, help=t("help.quantity_join"))
    p.add_argument("--tokens-file", help=t("help.tokens_one"))
    add_humanize_options(p)
    add_wait_options(p)

    p = tsub.add_parser("humanize", help=t("help.create_humanize"))
    p.add_argument("--mode", choices=["stock", "byot"], default="stock")
    p.add_argument("--product", help=t("help.product_task"))
    p.add_argument("--quantity", type=int, help=t("help.quantity_humanize"))
    p.add_argument("--tokens-file", help=t("help.tokens_one"))
    add_humanize_options(p)
    add_wait_options(p)
    return parser


def _language_from_argv(argv: list[str]) -> str:
    for index, arg in enumerate(argv):
        if arg.startswith("--lang="):
            return arg.split("=", 1)[1]
        if arg == "--lang" and index + 1 < len(argv):
            return argv[index + 1]
    return "auto"


def _confirm_purchase(account: str, amount: int) -> bool:
    if not sys.stdin.isatty():
        raise CLIError(t("purchase.tty_required"))
    answer = input(t("purchase.confirm", amount=amount, product=account) + " [y/N]: ").strip().lower()
    return answer in {"y", "yes", "はい", "h", "예", "네", "हाँ", "हां"}


def _tokens(path: str) -> list[str]:
    warning = token_file_permissions_warning(path)
    if warning:
        log_line("!", warning)
    return load_tokens(path)


def wait_for_job(
    client: Salta7Client,
    job_id: str,
    interval: float,
    *,
    json_mode: bool,
    compact: bool,
    jsonl: bool,
    heartbeat: float = 60.0,
) -> Any:
    if interval <= 0:
        raise CLIError(t("error.interval_positive"))
    last_signature: Optional[tuple[Any, ...]] = None
    last_print = 0.0
    while True:
        job = client.task_status(job_id)
        now = time.monotonic()
        signature = task_signature(job)
        status = str(job.get("status", "")).lower() if isinstance(job, dict) else ""
        changed = signature != last_signature
        terminal = status in TERMINAL_STATUSES
        heartbeat_due = now - last_print >= heartbeat
        if changed or terminal or heartbeat_due:
            if jsonl:
                print_jsonl(job)
            elif json_mode:
                print_json(job, compact=compact)
            else:
                render_task_status(job)
            last_signature = signature
            last_print = now
        if terminal:
            return job
        time.sleep(interval)


def maybe_wait(client: Salta7Client, result: Any, payload: Dict[str, Any], args: argparse.Namespace) -> None:
    json_mode = bool(args.json or args.compact or args.jsonl)
    if args.jsonl:
        print_jsonl(result)
    elif args.json or args.compact:
        print_json(result, compact=args.compact)
    else:
        render_task_created(result, payload)
    if getattr(args, "wait", False):
        if not isinstance(result, dict) or not result.get("job_id"):
            raise CLIError(t("task.no_job_id"))
        if str(result.get("status", "")).lower() not in TERMINAL_STATUSES:
            wait_for_job(
                client,
                str(result["job_id"]),
                args.interval,
                json_mode=json_mode,
                compact=args.compact,
                jsonl=args.jsonl,
            )


def _can_prompt(json_mode: bool) -> bool:
    return not json_mode and sys.stdin.isatty() and sys.stdout.isatty()


def _resolve_store_product(client: Salta7Client, account: Optional[str], *, json_mode: bool, action: str) -> str:
    if account:
        return account
    action_key = "menu.stock" if action == "stock" else "menu.buy"
    select_key = "menu.stock_select" if action == "stock" else "menu.buy_select"
    if not _can_prompt(json_mode):
        raise CLIError(t("error.stock_product_required", action=t(action_key)))
    selected, _ = choose_store_product(client, t(select_key))
    return selected


def _resolve_task_product(client: Salta7Client, product: Optional[str], *, tool: str, json_mode: bool) -> str:
    if product:
        return product
    if not _can_prompt(json_mode):
        raise CLIError(t("error.stock_task_product", tool=tool.title()))
    title_key = "menu.join_select" if tool == "join" else "menu.humanize_select"
    selected, _ = choose_task_product(client, tool, t(title_key))
    return selected


def _resolve_amount(amount: Optional[int], *, json_mode: bool) -> int:
    if amount is not None:
        return amount
    if not _can_prompt(json_mode):
        raise CLIError(t("error.amount_required"))
    return ask_int(t("common.amount"), 1, 10000)


def main(argv: Optional[Iterable[str]] = None) -> int:
    raw_argv = list(argv) if argv is not None else sys.argv[1:]
    set_language(_language_from_argv(raw_argv))
    parser = build_parser()
    args = parser.parse_args(raw_argv)
    set_language(args.lang)
    json_mode = bool(args.json or args.compact or args.jsonl)
    configure_color(args.no_color, json_mode)

    retry_attempts = max(1, args.retries)
    client = Salta7Client(args.base_url, args.token, args.timeout, retry=RetryConfig(attempts=retry_attempts))

    if not args.command:
        if sys.stdin.isatty() and sys.stdout.isatty() and not json_mode:
            try:
                return interactive_main(client)
            except CLIError as exc:
                log_line("✗", f"{t('common.error')}: {exc}", stream=sys.stderr)
                return 1
        if not json_mode:
            full_logo()
        parser.print_help()
        return 0

    if args.command == "menu":
        if json_mode:
            parser.error(t("error.menu_json"))
        return interactive_main(client)

    titles = {
        "doctor": t("title.doctor"),
        "prices": t("title.prices"),
        "stock": t("title.stock"),
        "balance": t("title.balance"),
        "buy": t("title.purchase"),
        "history": t("title.purchase_history"),
        "history-items": t("title.delivered_items"),
    }
    task_titles = {
        "quote": t("title.task_quote"),
        "products": t("title.task_products"),
        "active": t("title.active_task"),
        "status": t("title.task_status"),
        "history": t("title.task_history"),
        "items": t("title.task_items"),
        "byot-quote": t("title.byot_quote"),
        "boost": t("title.boost"),
        "join": t("title.join"),
        "humanize": t("title.humanize"),
    }
    if not json_mode:
        if args.command == "task":
            command_banner(task_titles.get(args.task_command, str(args.task_command).title()))
        else:
            command_banner(titles.get(args.command, args.command.replace("-", " ").title()))

    def output(data: Any, title: Optional[str] = None) -> None:
        if args.jsonl:
            print_jsonl(data)
        elif args.json or args.compact:
            print_json(data, compact=args.compact)
        else:
            render_result(data, title or t("common.result"), reveal_secrets=args.reveal_secrets)

    try:
        if args.command == "doctor":
            return 0 if run_doctor(client) else 1
        if args.command == "prices":
            output(client.prices(), t("title.prices"))
            return 0
        if args.command == "stock":
            account = _resolve_store_product(client, args.account, json_mode=json_mode, action="stock")
            output(client.stock(account), f"{t('title.stock')} · {account}")
            return 0
        if args.command == "balance":
            output(client.balance(), t("title.balance"))
            return 0
        if args.command == "buy":
            account = _resolve_store_product(client, args.account, json_mode=json_mode, action="buy")
            amount = _resolve_amount(args.amount, json_mode=json_mode)
            ensure_range(amount, 1, 10000, t("common.amount"))
            if not args.yes and not _confirm_purchase(account, amount):
                log_line("!", t("common.purchase_cancelled"))
                return 0
            tx_id = args.client_tx_id or str(uuid.uuid4())
            if not args.client_tx_id and not json_mode:
                log_line("•", t("common.generated_tx", tx_id=tx_id))
            output(client.buy(account, amount, tx_id), t("title.purchase_completed"))
            return 0
        if args.command == "history":
            output(client.history(), t("title.purchase_history"))
            return 0
        if args.command == "history-items":
            output(client.history_items(args.tx_id), t("title.delivered_items_lower"))
            return 0

        tc = args.task_command
        if tc == "quote":
            output(client.task_quote(), t("title.task_quote"))
            return 0
        if tc == "products":
            output(client.task_products(args.tool), t("title.task_products"))
            return 0
        if tc == "active":
            output(client.task_active(), t("title.active_task"))
            return 0
        if tc == "status":
            if args.watch:
                wait_for_job(
                    client,
                    args.job_id,
                    args.interval,
                    json_mode=json_mode,
                    compact=args.compact,
                    jsonl=args.jsonl,
                )
            else:
                job = client.task_status(args.job_id)
                output(job, t("title.task_status")) if json_mode else render_task_status(job)
            return 0
        if tc == "history":
            ensure_range(args.limit, 1, 100, "limit")
            output(client.task_history(args.tool, args.limit), t("title.task_history"))
            return 0
        if tc == "items":
            output(client.task_items(args.job_id, args.byot), t("title.task_items"))
            return 0
        if tc == "byot-quote":
            if args.boosts_needed < 0:
                raise CLIError(t("error.boosts_needed_negative"))
            output(
                client.task_byot_quote(_tokens(args.tokens_file), args.boosts_needed, args.humanize),
                t("title.byot_quote"),
            )
            return 0

        if tc == "boost":
            payload: Dict[str, Any] = {"tool": "boost", "mode": args.mode, "invite": args.invite}
            if args.mode == "stock":
                if args.boosts is None:
                    raise CLIError(t("error.stock_boost_boosts"))
                ensure_range(args.boosts, 1, 40, t("common.boosts"))
                payload["boosts"] = args.boosts
            else:
                if not args.tokens_file:
                    raise CLIError(t("error.byot_boost_tokens"))
                payload["tokens"] = _tokens(args.tokens_file)
                if args.boosts_needed < 0:
                    raise CLIError(t("error.boosts_needed_negative"))
                payload["boosts_needed"] = args.boosts_needed
            humanize = build_humanize_config(vars(args))
            if humanize:
                payload["humanize"] = humanize
            maybe_wait(client, client.task_create(payload), payload, args)
            return 0

        if tc == "join":
            payload = {"tool": "join", "mode": args.mode, "invite": args.invite}
            if args.mode == "stock":
                product = _resolve_task_product(client, args.product, tool="join", json_mode=json_mode)
                quantity = args.quantity
                if quantity is None:
                    if not _can_prompt(json_mode):
                        raise CLIError(t("error.stock_join_quantity"))
                    quantity = ask_int(t("common.quantity"), 1, 100)
                ensure_range(quantity, 1, 100, t("common.quantity"))
                payload.update({"product": product, "quantity": quantity})
            else:
                if not args.tokens_file:
                    raise CLIError(t("error.byot_join_tokens"))
                payload["tokens"] = _tokens(args.tokens_file)
            humanize = build_humanize_config(vars(args))
            if humanize:
                payload["humanize"] = humanize
            maybe_wait(client, client.task_create(payload), payload, args)
            return 0

        if tc == "humanize":
            payload = {"tool": "humanize", "mode": args.mode, "humanize": build_humanize_config(vars(args), required=True)}
            if args.mode == "stock":
                product = _resolve_task_product(client, args.product, tool="humanize", json_mode=json_mode)
                quantity = args.quantity
                if quantity is None:
                    if not _can_prompt(json_mode):
                        raise CLIError(t("error.stock_humanize_quantity"))
                    quantity = ask_int(t("common.quantity"), 1, 100)
                ensure_range(quantity, 1, 100, t("common.quantity"))
                payload.update({"product": product, "quantity": quantity})
            else:
                if not args.tokens_file:
                    raise CLIError(t("error.byot_humanize_tokens"))
                payload["tokens"] = _tokens(args.tokens_file)
            maybe_wait(client, client.task_create(payload), payload, args)
            return 0

        parser.error(t("error.unknown_command"))
        return 2
    except KeyboardInterrupt:
        log_line("!", t("common.interrupted"), stream=sys.stderr)
        return 130
    except CLIError as exc:
        log_line("✗", f"{paint(t('common.error'), 'red', 'bold')}: {exc}", stream=sys.stderr)
        return 1
