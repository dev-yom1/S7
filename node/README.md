# ⚡ Salta7 CLI for Node.js — `s7-node`

Official Node.js implementation of the Salta7 CLI for the Salta7 Store API.

The Python CLI remains supported as `s7`. The Node.js package intentionally uses the `s7-node` command so both versions can be installed without colliding.

> Looking for the Python CLI? See the [main README](../README.md).

## Requirements

- Node.js 22 or newer
- No runtime dependencies
- Built on standard Node.js APIs, including `fetch`

## Install

```bash
npm install --global salta7-cli-node
```

Check the installation:

```bash
s7-node --version
s7-node --help
```

## Quick start

```bash
s7-node prices
s7-node stock
s7-node balance
s7-node history
s7-node doctor
```

For authenticated commands, set your Salta7 API token in the environment:

```bash
export SALTA7_TOKEN="YOUR_TOKEN"
```

Windows PowerShell:

```powershell
$env:SALTA7_TOKEN="YOUR_TOKEN"
```

You can also pass `--token`, but environment variables are safer for secrets:

```bash
s7-node --token "$SALTA7_TOKEN" balance
```

## Highlights

- Prices, stock, balance, purchases, and purchase history
- Task quote, products, active tasks, status, history, and items
- Boost, Join, and Humanize tasks
- Stock and BYOT task modes
- Interactive product selection and looping interactive menu
- `task status --watch` and task `--wait`
- `doctor` diagnostics
- Self-update through npm
- English, Japanese, Korean, and Hindi UI
- JSON, compact JSON, and JSONL output
- Recursive secret masking in human-readable output
- Retry/backoff for transient failures
- HTTPS enforcement with explicit loopback-only HTTP support for local development
- No runtime dependencies

## Language

The CLI supports four UI languages:

| Language | Code |
| --- | --- |
| English | `en` |
| 日本語 | `ja` |
| 한국어 | `ko` |
| हिन्दी | `hi` |

Choose one with `--lang`:

```bash
s7-node --lang ja prices
s7-node --lang ko balance
s7-node --lang hi doctor
```

You can also set `SALTA7_LANG`.

Command names and option names remain in English for shell-script compatibility.

## Interactive menu

Run without a command in a terminal:

```bash
s7-node
```

Or open the menu explicitly:

```bash
s7-node menu
```

The menu loops until you choose Exit and includes common account, purchase, task, watch, BYOT quote, Boost, Join, Humanize, and diagnostic actions.

When stdin/stdout is not a TTY, the CLI avoids interactive prompts so scripts and CI do not hang.

## Account and purchase commands

```bash
s7-node prices
s7-node stock
s7-node stock PRODUCT
s7-node balance
s7-node history
s7-node history-items TX_ID
```

Buy a product:

```bash
s7-node buy PRODUCT 2
```

Interactive terminals ask for confirmation. For deliberate non-interactive use:

```bash
s7-node buy PRODUCT 2 --yes
```

## Task information

```bash
s7-node task quote
s7-node task products
s7-node task products --tool join
s7-node task products --tool humanize
s7-node task active
s7-node task status JOB_ID
s7-node task status JOB_ID --watch
s7-node task history
s7-node task items JOB_ID
```

Watch mode suppresses duplicate progress output and emits a heartbeat when a task remains unchanged for an extended period.

## Boost

Stock mode:

```bash
s7-node task boost \
  --mode stock \
  --invite discord.gg/example \
  --boosts 2 \
  --wait
```

BYOT mode:

```bash
s7-node task boost \
  --mode byot \
  --invite discord.gg/example \
  --tokens-file tokens.txt \
  --wait
```

## Join

Stock mode:

```bash
s7-node task join \
  --mode stock \
  --invite discord.gg/example \
  --quantity 10 \
  --wait
```

BYOT mode:

```bash
s7-node task join \
  --mode byot \
  --invite discord.gg/example \
  --tokens-file tokens.txt \
  --wait
```

When a Stock-mode product is required and omitted in an interactive terminal, the CLI can select from the products returned by the API.

## BYOT

BYOT mode uses account tokens you provide instead of Salta7 Stock.

The API documentation uses the name `byot`, but does not define an official expansion of the acronym, so this README describes the behavior without expanding it.

A token file normally contains one token per line:

```text
TOKEN_1
TOKEN_2
TOKEN_3
```

Use it with `--tokens-file`:

```bash
s7-node task byot-quote --tokens-file tokens.txt
```

`task byot-quote` is an estimate only; it does not create a task.

Token files contain credentials. Do not commit them or paste them into logs. On POSIX systems, `s7-node` warns when a token file has overly broad permissions.

## Humanize

In S7, **Humanize means configuring or randomizing account profile settings**. It is not a text-rewriting feature.

Supported profile fields include:

- avatar
- banner
- name
- bio
- pronouns
- HypeSquad

Randomize supported fields:

```bash
s7-node task humanize \
  --mode stock \
  --quantity 2 \
  --random-all \
  --wait
```

Use custom values:

```bash
s7-node task humanize \
  --mode stock \
  --quantity 2 \
  --name "Leo" \
  --bio "coffee and code" \
  --pronouns "they/them" \
  --hypesquad brilliance
```

Use local images:

```bash
s7-node task humanize \
  --mode stock \
  --quantity 2 \
  --avatar-file ./avatar.png \
  --banner-file ./banner.png
```

A custom avatar can also use `--avatar-url`. Banner is custom-only and is not included in `--random-all`.

The legacy `--humanize-json` option remains available for compatibility.

## JSON output

Pretty JSON:

```bash
s7-node --json balance
```

Compact JSON:

```bash
s7-node --compact balance
```

JSON Lines:

```bash
s7-node --jsonl task status JOB_ID --watch
```

Machine-readable output is intentionally lossless: `--json`, `--compact`, and `--jsonl` serialize API values without secret masking or other modification.

That means raw JSON may contain sensitive values. Do not send it to untrusted logs or services.

Human-readable output masks common secrets unless `--reveal-secrets` is explicitly used.

## Diagnostics

```bash
s7-node doctor
```

`doctor` checks the local Node.js runtime, API URL configuration, token availability, built-in `fetch`, and API connectivity/authentication.

A missing API token is treated as a failed diagnostic.

## Updates

Check for a newer Node package:

```bash
s7-node update --check
```

Install an available update:

```bash
s7-node update
```

For non-interactive use:

```bash
s7-node update --yes
```

The Node CLI checks the npm Registry entry for `salta7-cli-node`. It does not use the repository's GitHub Releases for Node version discovery, so Python and Node release versions remain independent.

## Security and transport

API base URLs must use HTTPS.

Plain HTTP is accepted only for loopback hosts such as `localhost`, `127.0.0.1`, and `::1`, and only when `--allow-insecure-http` is explicitly supplied. HTTP to external hosts is rejected even with that flag.

Request timeouts must be greater than zero. Transient network errors and retryable HTTP responses use bounded retry/backoff behavior.

Disable ANSI color with:

```bash
s7-node --no-color balance
```

## Common global options

```text
--lang LANG
--base-url URL
--token TOKEN
--timeout SEC
--retries N
--json
--compact
--jsonl
--no-color
--reveal-secrets
--allow-insecure-http
--version
```

Global options go before the command:

```bash
s7-node --lang ja prices
s7-node --json balance
s7-node --no-color task active
```

## Development

From the repository:

```bash
cd node
npm run check
npm test
node ./bin/s7.js --version
```

The Node implementation uses `node:test` and standard Node.js modules, with no runtime package dependencies.

## License

MIT. See [`../LICENSE`](../LICENSE).
