from __future__ import annotations

import os
import sys
from typing import Optional

from .client import CLIError, Salta7Client
from .humanize import image_file_to_data_url, normalize_hypesquad
from .i18n import t
from .output import command_banner, full_logo, log_line, render_result, render_task_created
from .utils import ensure_range, load_tokens, token_file_permissions_warning, validate_humanize


class MenuCancelled(CLIError):
    def __init__(self) -> None:
        super().__init__(t("common.cancelled"))


def _read_key() -> str:
    if os.name == "nt":
        import msvcrt

        ch = msvcrt.getwch()
        if ch in {"\x00", "\xe0"}:
            ch2 = msvcrt.getwch()
            return {"H": "up", "P": "down"}.get(ch2, "")
        if ch in {"\r", "\n"}:
            return "enter"
        if ch == "\x1b":
            return "esc"
        if ch.lower() == "q":
            return "quit"
        return ch

    import termios
    import tty

    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        ch = sys.stdin.read(1)
        if ch == "\x1b":
            seq = sys.stdin.read(2)
            return {"[A": "up", "[B": "down"}.get(seq, "esc")
        if ch in {"\r", "\n"}:
            return "enter"
        if ch.lower() == "q":
            return "quit"
        return ch
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)


def select(title: str, options: list[str]) -> int:
    if not sys.stdin.isatty() or not sys.stdout.isatty():
        raise CLIError(t("common.terminal_required"))
    index = 0
    print(title)
    print(t("common.use_keys") + "\n")
    lines = 0
    while True:
        if lines:
            sys.stdout.write(f"\x1b[{lines}A")
        for i, option in enumerate(options):
            prefix = "›" if i == index else " "
            sys.stdout.write(f"\r\x1b[2K {prefix} {option}\n")
        sys.stdout.flush()
        lines = len(options)
        key = _read_key()
        if key == "up":
            index = (index - 1) % len(options)
        elif key == "down":
            index = (index + 1) % len(options)
        elif key == "enter":
            print()
            return index
        elif key in {"quit", "esc"}:
            print()
            raise MenuCancelled()


def ask(prompt: str, *, required: bool = True, default: Optional[str] = None) -> str:
    suffix = f" [{default}]" if default is not None else ""
    while True:
        value = input(f"{prompt}{suffix}: ").strip()
        if not value and default is not None:
            return default
        if value or not required:
            return value
        print(t("common.enter_value"))


def ask_int(prompt: str, low: int, high: int, *, default: Optional[int] = None) -> int:
    while True:
        raw = ask(prompt, default=str(default) if default is not None else None)
        try:
            value = int(raw)
            ensure_range(value, low, high, prompt.lower())
            return value
        except (ValueError, CLIError) as exc:
            print(t("common.invalid_value", error=exc))


def ask_yes_no(prompt: str, *, default: bool = False) -> bool:
    hint = "Y/n" if default else "y/N"
    value = input(f"{prompt} [{hint}]: ").strip().lower()
    if not value:
        return default
    return value in {"y", "yes", "はい", "h", "예", "네", "हाँ", "हां"}


def choose_mode() -> str:
    return ["stock", "byot"][select(t("common.mode"), [t("menu.mode_stock"), t("menu.mode_byot")])]


def _product_records(data: object) -> list[dict]:
    """Extract product dictionaries from the API's common list response shapes."""
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if isinstance(data, dict):
        for key in ("products", "items", "data", "results"):
            value = data.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
    return []


def _product_slug(product: dict) -> str | None:
    for key in ("product", "account", "slug", "code"):
        value = product.get(key)
        if value not in (None, ""):
            return str(value)
    return None


def _product_option(product: dict) -> str:
    slug = _product_slug(product) or t("common.unknown")
    title = str(product.get("title") or product.get("name") or slug)
    details: list[str] = []
    if slug != title:
        details.append(slug)
    if product.get("price") not in (None, ""):
        details.append(f"{t('common.price')} {product['price']}")
    if product.get("stock") not in (None, ""):
        details.append(f"{t('common.stock')} {product['stock']}")
    return f"{title}  •  " + "  •  ".join(details) if details else title


def choose_product(title: str, data: object) -> tuple[str, dict]:
    products = [product for product in _product_records(data) if _product_slug(product)]
    if not products:
        raise CLIError(t("common.no_products"))
    index = select(title, [_product_option(product) for product in products])
    selected = products[index]
    slug = _product_slug(selected)
    if slug is None:
        raise CLIError(t("common.no_product_slug"))
    return slug, selected


def choose_store_product(client: Salta7Client, title: Optional[str] = None) -> tuple[str, dict]:
    return choose_product(title or t("common.select_product"), client.prices())


def choose_task_product(client: Salta7Client, tool: str, title: Optional[str] = None) -> tuple[str, dict]:
    return choose_product(title or t("common.select_stock_product"), client.task_products(tool))


def maybe_tokens_file() -> tuple[str, list[str]]:
    path = ask(t("common.tokens_file"))
    warning = token_file_permissions_warning(path)
    if warning:
        log_line("!", warning)
    return path, load_tokens(path)


def _field_mode(field: str, *, allow_random: bool = True) -> str:
    options = [("skip", t("humanize.unchanged"))]
    if allow_random:
        options.append(("random", t("humanize.random")))
    options.append(("custom", t("humanize.custom")))
    return options[select(t("humanize.configure_field", field=t(f"humanize.field.{field}")), [label for _, label in options])][0]


def _humanize_prompt(required: bool = False) -> Optional[dict]:
    if not required and not ask_yes_no(t("common.add_humanize"), default=False):
        return None

    presets = [t("humanize.preset_random"), t("humanize.preset_custom")]
    if not required:
        presets.append(t("humanize.preset_cancel"))
    preset = select(t("humanize.preset_title"), presets)
    if preset == 0:
        return {field: {"source": "random"} for field in ("avatar", "name", "bio", "pronouns", "hypesquad")}
    if preset == 2 and not required:
        return None

    config: dict = {}

    avatar_mode = _field_mode("avatar")
    if avatar_mode == "random":
        config["avatar"] = {"source": "random"}
    elif avatar_mode == "custom":
        avatar_source = select(t("humanize.avatar_source"), [t("humanize.from_url"), t("humanize.from_file")])
        value = ask(t("humanize.avatar_url")) if avatar_source == 0 else image_file_to_data_url(ask(t("humanize.avatar_file")))
        config["avatar"] = {"source": "custom", "value": value}

    banner_mode = _field_mode("banner", allow_random=False)
    if banner_mode == "custom":
        config["banner"] = {"source": "custom", "value": image_file_to_data_url(ask(t("humanize.banner_file")))}

    for field in ("name", "bio", "pronouns"):
        mode = _field_mode(field)
        if mode == "random":
            config[field] = {"source": "random"}
        elif mode == "custom":
            config[field] = {"source": "custom", "value": ask(t(f"humanize.value.{field}"))}

    hypesquad_mode = _field_mode("hypesquad")
    if hypesquad_mode == "random":
        config["hypesquad"] = {"source": "random"}
    elif hypesquad_mode == "custom":
        house = ["bravery", "brilliance", "balance"][
            select(t("humanize.hypesquad_house"), [t("humanize.bravery"), t("humanize.brilliance"), t("humanize.balance")])
        ]
        config["hypesquad"] = {"source": "custom", "value": normalize_hypesquad(house)}

    if not config:
        if required:
            raise CLIError(t("humanize.required"))
        return None
    validate_humanize(config)
    return config


def _watch(client: Salta7Client, job_id: str, interval: float = 10.0) -> None:
    from .cli import wait_for_job

    wait_for_job(client, job_id, interval, json_mode=False, compact=False, jsonl=False)


def interactive_main(client: Salta7Client) -> int:
    full_logo()
    actions = [
        ("balance", "menu.balance"),
        ("prices", "menu.prices"),
        ("stock", "menu.stock"),
        ("buy", "menu.buy"),
        ("history", "menu.history"),
        ("active", "menu.active"),
        ("watch", "menu.watch"),
        ("boost", "menu.boost"),
        ("join", "menu.join"),
        ("humanize", "menu.humanize"),
        ("byot_quote", "menu.byot_quote"),
        ("doctor", "menu.doctor"),
        ("exit", "menu.exit"),
    ]

    while True:
        try:
            choice = select(t("menu.title"), [t(label) for _, label in actions])
            action = actions[choice][0]
            if action == "exit":
                return 0

            if action == "balance":
                command_banner(t("title.balance"))
                render_result(client.balance(), t("title.balance"))
            elif action == "prices":
                command_banner(t("title.prices"))
                render_result(client.prices(), t("title.prices"))
            elif action == "stock":
                account, _ = choose_store_product(client, t("menu.stock_select"))
                command_banner(t("title.stock"))
                render_result(client.stock(account), f"{t('title.stock')} · {account}")
            elif action == "buy":
                account, product = choose_store_product(client, t("menu.buy_select"))
                amount = ask_int(t("common.amount"), 1, 10000)
                title = product.get("title") or product.get("name") or account
                if not ask_yes_no(t("purchase.confirm_slug", amount=amount, title=title, slug=account), default=False):
                    log_line("!", t("common.purchase_cancelled"))
                else:
                    import uuid

                    tx_id = str(uuid.uuid4())
                    command_banner(t("title.purchase"))
                    log_line("•", t("common.generated_tx", tx_id=tx_id))
                    render_result(client.buy(account, amount, tx_id), t("title.purchase_completed"))
            elif action == "history":
                command_banner(t("title.purchase_history"))
                render_result(client.history(), t("title.purchase_history"))
            elif action == "active":
                command_banner(t("title.active_task"))
                render_result(client.task_active(), t("title.active_task"))
            elif action == "watch":
                job_id = ask(t("common.job_id"))
                command_banner(t("title.task_status"))
                _watch(client, job_id)
            elif action == "boost":
                mode = choose_mode()
                invite = ask(t("common.discord_invite"))
                payload: dict = {"tool": "boost", "mode": mode, "invite": invite}
                if mode == "stock":
                    payload["boosts"] = ask_int(t("common.boosts"), 1, 40)
                else:
                    _, tokens = maybe_tokens_file()
                    payload["tokens"] = tokens
                    payload["boosts_needed"] = ask_int(t("common.boosts_needed_all"), 0, 100, default=0)
                humanize = _humanize_prompt()
                if humanize:
                    payload["humanize"] = humanize
                command_banner(t("title.boost"))
                result = client.task_create(payload)
                render_task_created(result, payload)
                if (
                    isinstance(result, dict)
                    and result.get("job_id")
                    and ask_yes_no(t("common.watch_complete"), default=True)
                ):
                    _watch(client, str(result["job_id"]))
            elif action == "join":
                mode = choose_mode()
                invite = ask(t("common.discord_invite"))
                payload = {"tool": "join", "mode": mode, "invite": invite}
                if mode == "stock":
                    product, _ = choose_task_product(client, "join", t("menu.join_select"))
                    payload["product"] = product
                    payload["quantity"] = ask_int(t("common.quantity"), 1, 100)
                else:
                    _, tokens = maybe_tokens_file()
                    payload["tokens"] = tokens
                humanize = _humanize_prompt()
                if humanize:
                    payload["humanize"] = humanize
                command_banner(t("title.join"))
                result = client.task_create(payload)
                render_task_created(result, payload)
                if (
                    isinstance(result, dict)
                    and result.get("job_id")
                    and ask_yes_no(t("common.watch_complete"), default=True)
                ):
                    _watch(client, str(result["job_id"]))
            elif action == "humanize":
                mode = choose_mode()
                payload = {"tool": "humanize", "mode": mode, "humanize": _humanize_prompt(required=True)}
                if mode == "stock":
                    product, _ = choose_task_product(client, "humanize", t("menu.humanize_select"))
                    payload["product"] = product
                    payload["quantity"] = ask_int(t("common.quantity"), 1, 100)
                else:
                    _, tokens = maybe_tokens_file()
                    payload["tokens"] = tokens
                command_banner(t("title.humanize"))
                result = client.task_create(payload)
                render_task_created(result, payload)
                if (
                    isinstance(result, dict)
                    and result.get("job_id")
                    and ask_yes_no(t("common.watch_complete"), default=True)
                ):
                    _watch(client, str(result["job_id"]))
            elif action == "byot_quote":
                _, tokens = maybe_tokens_file()
                boosts_needed = ask_int(t("common.boosts_needed_none"), 0, 100, default=0)
                humanize = ask_yes_no(t("common.include_humanize"), default=False)
                command_banner(t("title.byot_quote"))
                render_result(client.task_byot_quote(tokens, boosts_needed, humanize), t("title.byot_quote"))
            elif action == "doctor":
                command_banner(t("title.doctor"))
                run_doctor(client)
            print()
        except MenuCancelled:
            return 0
        except KeyboardInterrupt:
            print("\n")
            return 130
        except CLIError as exc:
            log_line("✗", f"{t('common.error')}: {exc}")
            print()


def run_doctor(client: Salta7Client) -> bool:
    ok = True
    try:
        client.prices()
        log_line("✓", t("doctor.api_ok"))
    except CLIError as exc:
        log_line("✗", t("doctor.api_fail", error=exc))
        ok = False

    if client.token:
        try:
            client.balance()
            log_line("✓", t("doctor.auth_ok"))
        except CLIError as exc:
            log_line("✗", t("doctor.auth_fail", error=exc))
            ok = False
    else:
        log_line("!", t("doctor.token_missing"))
        ok = False

    try:
        client.task_quote()
        log_line("✓", t("doctor.task_ok"))
    except CLIError as exc:
        log_line("✗", t("doctor.task_fail", error=exc))
        ok = False
    return ok
