# ⚡ Salta7 CLI — `s7`

[![CI](https://github.com/dev-yom1/S7/actions/workflows/ci.yml/badge.svg)](https://github.com/dev-yom1/S7/actions/workflows/ci.yml)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**English** | **[日本語](README.ja.md)** | **[한국어](README.ko.md)** | **[हिन्दी](README.hi.md)**

A polished Python command-line client for the Salta7 Store API, with multilingual UI, friendly colored output, task progress monitoring, raw JSON modes, and an arrow-key interactive menu.

> **API reference:** `https://salta7-store.vercel.app/api`

## Highlights

- `s7` command after installation
- ↑/↓ interactive terminal menu
- English/Japanese/Korean/Hindi UI with automatic locale detection and `--lang` override
- Colored status output and progress bars
- `--json`, `--compact`, and `--jsonl` machine-readable modes
- `task status --watch` / task `--wait` monitoring
- Duplicate progress suppression with periodic heartbeat output
- Safe retries for GET requests and idempotent `/buy` calls
- Secret-aware human output
- Readable card rendering for direct and nested record lists
- Translation completeness/placeholder integrity tests across every supported locale
- BYOT token-file permission warnings on macOS/Linux
- `s7 doctor` connectivity/auth diagnostics
- Zero interactive-menu dependencies; only `requests` is required at runtime
- Tests + GitHub Actions CI

## Install

### From a source checkout

Clone the repository, then:

```bash
git clone https://github.com/dev-yom1/S7.git
cd S7
python -m venv .venv
```

Activate the virtual environment:

```bash
# macOS / Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

Then install:

```bash
python -m pip install -U pip
python -m pip install .
```

Check it:

```bash
s7 --version
s7 doctor
```

For development:

```bash
python -m pip install -e ".[dev]"
pytest
ruff check .
```

## Authentication

Prefer an environment variable instead of putting the API token directly in shell history.

```bash
# macOS / Linux
export SALTA7_TOKEN="YOUR_TOKEN"
```

```powershell
# Windows PowerShell
$env:SALTA7_TOKEN="YOUR_TOKEN"
```

Optional base URL override:

```bash
export SALTA7_BASE_URL="https://salta7-store.ngrok.app"
```

You can also pass `--token` and `--base-url`, but environment variables are safer for secrets.

## Language / 多言語対応

Salta7 CLI ships with four UI languages. Commands and option names stay in English for shell-script compatibility, while menus, help text, status messages, errors, prompts, and common field labels are translated.

| Language | Code | Auto-detected examples |
| --- | --- | --- |
| English | `en` | `en_US`, `en_GB` |
| 日本語 | `ja` | `ja_JP` |
| 한국어 | `ko` | `ko_KR` |
| हिन्दी | `hi` | `hi_IN` |

Language selection priority:

1. `--lang`
2. `SALTA7_LANG`
3. OS locale (`LC_ALL`, `LC_MESSAGES`, `LANG`)
4. English fallback

Auto-detect from your system:

```bash
s7 prices
```

Force Japanese:

```bash
s7 --lang ja prices
s7 --lang ja menu
```

Force English:

```bash
s7 --lang en prices
```

Korean or Hindi:

```bash
s7 --lang ko prices
s7 --lang hi prices
```

Or set it once in your environment:

```bash
export SALTA7_LANG=ja
```

```powershell
$env:SALTA7_LANG="ja"
```

Machine-readable `--json`, `--compact`, and `--jsonl` output is **not translated**; it preserves the API response exactly. This keeps scripts stable regardless of UI language.

Japanese example:

```text
⚡ S7 • 商品・価格一覧

[15:47:10] ✓ 商品・価格一覧 (3件)
           1. Discord 1M Nitro
             商品          discord-1m-nitro
             価格          0.34
             形式          Email:Pass:Token
             保証          2-Day Warranty ...
             説明          Hotmail / Outlook Tokens ...
```

The translation layer is isolated from command/API logic. Core language selection lives in `src/salta7_cli/i18n.py`, with larger locale tables split into dedicated modules. Tests require every supported language to contain the same translation keys and formatting placeholders.

## Interactive menu

Run:

```bash
s7
```

When attached to a real terminal, Salta7 CLI opens an arrow-key menu:

```text
   _____  _____
  / ___/ /__  /
  \__ \    / /
 ___/ /   / /
/____/   /_/
  S A L T A 7   C L I  v2.4.0
  Fast access to Salta7 tools

What do you want to do?
Use ↑/↓ and Enter. Press q to quit.

 › Balance
   Prices
   Check stock
   Buy product
   Purchase history
   Active task
   Watch task
   Create Boost task
   Create Join task
   Create Humanize task
   BYOT quote
   Doctor
   Exit
```

You can open it explicitly with:

```bash
s7 menu
```

When stdin/stdout is not a TTY, running `s7` prints normal help instead, so shell scripts and CI do not get stuck in a prompt.

## Human-friendly output

Normal commands use a compact branded header:

```text
⚡ S7 • Boost

[15:17:12] ✓ Task created
           Job ID: job_abc123
           Tool: Boost
           Mode: STOCK
           Requested: 14

[15:17:22] ⟳ Running  4/14 delivered  █████░░░░░░░░░░░
[15:17:32] ⟳ Running 10/14 delivered  ███████████░░░░░
[15:17:42] ✓ Completed 14/14 delivered ████████████████
```

ANSI colors are used only when stdout supports them. Disable color with:

```bash
s7 --no-color balance
```

The standard `NO_COLOR` environment variable is also respected.

## JSON output

Pretty JSON:

```bash
s7 --json balance
```

Compact one-line JSON:

```bash
s7 --compact balance
```

JSON Lines is recommended for streams:

```bash
s7 --jsonl task status JOB_ID --watch
```

Example:

```json
{"status":"running","boosts_requested":14,"boosts_delivered":4}
{"status":"running","boosts_requested":14,"boosts_delivered":10}
{"status":"completed","boosts_requested":14,"boosts_delivered":14}
```

`--json`, `--compact`, and `--jsonl` intentionally expose the API response as-is and may contain sensitive data. Do not pipe raw output to untrusted logs.

## Secret-aware output

Human-friendly output masks common credential fields such as API tokens and account tokens by default.

Use this only when you intentionally need the exact values:

```bash
s7 --reveal-secrets history-items TX_ID
s7 --reveal-secrets task items JOB_ID
```

For raw data, `--json`/`--jsonl` also preserve the API response exactly.

## Diagnostics

```bash
s7 doctor
```

Example:

```text
⚡ S7 • Doctor

[15:29:10] ✓ API reachable
[15:29:10] ✓ Authentication valid
[15:29:10] ✓ Task API reachable
```

## Account & wallet commands

```bash
s7 prices
s7 stock                       # choose from /prices in a terminal
s7 stock discord-1m-nitro      # direct/script-friendly form
s7 balance
s7 history
s7 history-items TX_ID
```

### Buy

In a terminal you can omit the product and amount to choose from the live `/prices` list and then enter a quantity:

```bash
s7 buy
```

You can still provide everything directly:

```bash
s7 buy discord-1m-nitro 2
```

Purchases require confirmation in an interactive terminal.

For deliberate non-interactive automation:

```bash
s7 buy discord-1m-nitro 2 --yes
```

The CLI creates a UUID `client_tx_id` when one is not supplied. Reuse a known idempotency key when intentionally retrying the same purchase:

```bash
s7 buy discord-1m-nitro 2 --client-tx-id SAME_ID --yes
```

## Task information

```bash
s7 task quote
s7 task products
s7 task products --tool join
s7 task products --tool humanize
s7 task active
s7 task history --tool boost --limit 25
s7 task items JOB_ID
s7 task items JOB_ID --byot
```

## Watch a task

```bash
s7 task status JOB_ID
s7 task status JOB_ID --watch
```

Watch mode prints only meaningful status/progress changes instead of repeating the same line every poll. If nothing changes for a while, it emits an occasional heartbeat.

Default polling interval is 10 seconds:

```bash
s7 task status JOB_ID --watch --interval 5
```

## Boost

Stock mode:

```bash
s7 task boost \
  --mode stock \
  --invite discord.gg/abc123 \
  --boosts 14 \
  --wait
```

BYOT mode:

```bash
s7 task boost \
  --mode byot \
  --invite discord.gg/abc123 \
  --tokens-file tokens.txt \
  --boosts-needed 0 \
  --wait
```

Optional humanize settings:

```bash
s7 task boost \
  --mode stock \
  --invite discord.gg/abc123 \
  --boosts 2 \
  --humanize-json @humanize.example.json
```

## Join

Stock mode can choose a product from `/task/products?tool=join` when `--product` is omitted in a terminal:

```bash
s7 task join \
  --mode stock \
  --invite discord.gg/abc123 \
  --quantity 10 \
  --wait
```

For scripts, pass `--product PRODUCT_SLUG` explicitly.

BYOT mode:

```bash
s7 task join \
  --mode byot \
  --invite discord.gg/abc123 \
  --tokens-file tokens.txt \
  --wait
```

## Humanize

Humanize is CLI-native — you do **not** need to write JSON for normal use. Stock mode can also choose a product from `/task/products?tool=humanize` when `--product` is omitted in a terminal.

Randomize every field supported by the API's random library (`avatar`, `name`, `bio`, `pronouns`, `hypesquad`):

```bash
s7 task humanize \
  --mode stock \
  --quantity 10 \
  --random-all \
  --wait
```

Mix random and custom values. Explicit field options override `--random-all`:

```bash
s7 task humanize \
  --mode stock \
  --quantity 10 \
  --random-all \
  --name "Leo" \
  --bio "coffee and code" \
  --hypesquad balance \
  --wait
```

Use local images without manually generating base64 JSON. The CLI converts them to API-compatible `data:image/...` URLs:

```bash
s7 task humanize \
  --mode stock \
  --quantity 2 \
  --avatar-file ./avatar.png \
  --banner-file ./banner.png
```

A custom avatar may also be an image URL:

```bash
s7 task humanize --mode stock --quantity 2 \
  --avatar-url "https://example.com/avatar.png" \
  --random-name
```

BYOT mode works with the same Humanize flags:

```bash
s7 task humanize \
  --mode byot \
  --tokens-file tokens.txt \
  --random-avatar \
  --random-name \
  --pronouns "they/them" \
  --hypesquad brilliance \
  --wait
```

Available profile options:

```text
--random-all
--random-avatar | --avatar-url URL | --avatar-file PATH
--banner-file PATH | --banner-data DATA_URL
--random-name | --name TEXT
--random-bio | --bio TEXT
--random-pronouns | --pronouns TEXT
--random-hypesquad | --hypesquad bravery|brilliance|balance|1|2|3
```

`banner` is custom-only, matching the API. `--random-all` therefore leaves the banner untouched.

The old JSON form is still available for advanced usage and backward compatibility:

```bash
s7 task humanize --mode stock --product PRODUCT_SLUG --quantity 2 \
  --humanize-json '{"name":{"source":"random"}}'
```

The same CLI-native Humanize flags can be appended to `s7 task boost` and `s7 task join` when you want optional profile setup as part of those tasks.

## BYOT quote

```bash
s7 task byot-quote --tokens-file tokens.txt
s7 task byot-quote --tokens-file tokens.txt --boosts-needed 10 --humanize
```

On macOS/Linux, the CLI warns when a BYOT token file is accessible to group/other users. A typical private permission is:

```bash
chmod 600 tokens.txt
```

## Reliability behavior

By default, the client attempts safe/idempotent requests up to three times for transient `429`/`5xx` responses or temporary network errors.

```bash
s7 --retries 5 prices
```

Task creation requests are **not** automatically retried because replaying a task-creation POST could create duplicate work. `/buy` can be retried because the CLI supplies an idempotency key.

## Global options

```text
--lang LANG          UI language: auto, en, ja, ko, hi
--base-url URL       Override API base URL
--token TOKEN        API token; SALTA7_TOKEN is recommended
--timeout SEC        HTTP timeout
--retries N          Safe/idempotent request attempts
--json               Pretty raw JSON
--compact            One-line raw JSON
--jsonl               Newline-delimited raw JSON
--no-color           Disable ANSI colors
--reveal-secrets     Reveal secret values in human output
--version            Show CLI version
```

Global options go before the command:

```bash
s7 --json balance
s7 --no-color task active
```

## Project layout

```text
S7/
├── src/salta7_cli/
│   ├── __init__.py
│   ├── __main__.py
│   ├── cli.py
│   ├── client.py
│   ├── humanize.py
│   ├── i18n.py
│   ├── interactive.py
│   ├── locale_en.py
│   ├── locale_ja.py
│   ├── locale_ko.py
│   ├── locale_hi.py
│   ├── output.py
│   └── utils.py
├── tests/
├── .github/workflows/ci.yml
├── README.md
├── README.ja.md
├── README.ko.md
├── README.hi.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── pyproject.toml
```

## Security and responsible use

- Keep `SALTA7_TOKEN`, BYOT files, and delivered account/token data private.
- Never commit `.env`, `tokens.txt`, purchased account data, or raw credential dumps.
- Use automation only for accounts, servers, and resources you are authorized to manage, and follow the rules of the services involved.
- See [`SECURITY.md`](SECURITY.md) before reporting credential-handling issues.

## Development checks

```bash
pytest
ruff check .
python -m compileall -q src
s7 --version
s7 --help
```

## License

MIT. See [`LICENSE`](LICENSE).
