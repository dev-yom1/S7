# Salta7 CLI — Node.js implementation

Node.js 22+ implementation of the Salta7 CLI. It is developed alongside the Python CLI and intentionally uses the `s7-node` executable name so both versions can coexist.

## Requirements

- Node.js 22 or newer
- No runtime npm dependencies
- Standard `fetch` / `AbortController`

## Development

```bash
cd node
npm run check
npm test
node ./bin/s7.js --help
```

## Global options

```text
--lang auto|en|ja|ko|hi
--base-url URL
--token TOKEN
--timeout SECONDS
--retries N
--allow-insecure-http
--json
--jsonl
--compact
--reveal-secrets
```

English, Japanese, Korean, and Hindi UI messages are supported. `auto` uses the process locale when possible.

## Commands

The Node CLI currently supports the store commands (`prices`, `stock`, `balance`, `buy`, `history`, `history-items`), task inspection commands, BYOT quote, Boost, Join, Humanize, task watch/wait, and update checks.

Examples:

```bash
SALTA7_TOKEN=... node ./bin/s7.js balance
node ./bin/s7.js prices
node ./bin/s7.js stock discord-1m-nitro
SALTA7_TOKEN=... node ./bin/s7.js task status JOB_ID --watch
```

### Boost

```bash
SALTA7_TOKEN=... node ./bin/s7.js task boost \
  --mode stock \
  --invite abc123 \
  --boosts 4 \
  --wait
```

BYOT mode reads account tokens from a local file. Treat this file as a secret and never commit it to Git.

```bash
SALTA7_TOKEN=... node ./bin/s7.js task boost \
  --mode byot \
  --invite abc123 \
  --tokens-file ./tokens.txt \
  --boosts-needed 4
```

### Join

```bash
SALTA7_TOKEN=... node ./bin/s7.js task join \
  --mode stock \
  --invite abc123 \
  --product PRODUCT_ID \
  --quantity 10
```

### Humanize

Humanize configures or randomizes profile properties for target accounts. It is not a text-rewriting feature.

Supported CLI-native options:

```text
--random-all
--random-avatar
--avatar-url URL
--avatar-file FILE
--banner-file FILE
--banner-data DATA_URL
--random-name
--name TEXT
--random-bio
--bio TEXT
--random-pronouns
--pronouns TEXT
--random-hypesquad
--hypesquad 1|2|3|bravery|brilliance|balance
--humanize-json JSON_OR_@FILE
```

`banner` is custom-only. Legacy `--humanize-json` remains supported; explicit CLI-native options override matching fields from the legacy JSON object.

```bash
SALTA7_TOKEN=... node ./bin/s7.js task humanize \
  --mode byot \
  --tokens-file ./tokens.txt \
  --random-all
```

## Transport safety

HTTPS is required for API requests. Plain HTTP is rejected even when `--allow-insecure-http` is present unless the host is loopback (`localhost`, `127.0.0.0/8`, or `::1`).

For local development only:

```bash
node ./bin/s7.js \
  --base-url http://127.0.0.1:8000 \
  --allow-insecure-http \
  prices
```

Timeouts must be positive, authenticated calls use Bearer auth, retryable requests use bounded retries, and sensitive fields are masked unless `--reveal-secrets` is explicitly requested.
