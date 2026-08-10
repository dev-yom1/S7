# Salta7 CLI for Node.js

Official Node.js implementation of the Salta7 CLI. The Python CLI remains supported; the Node binary is intentionally named `s7-node` to avoid command conflicts.

## Requirements

- Node.js 22 or newer
- No runtime dependencies; uses built-in `fetch`, `node:test`, and standard Node modules

## Install

```bash
npm install --global salta7-cli-node
s7-node --version
```

## npm publishing

Node releases use npm Trusted Publishing with GitHub Actions OIDC. The release workflow is `.github/workflows/publish-node.yml`; it uses a GitHub-hosted Node 24 runner, requests `id-token: write`, validates the package, verifies `node-vX.Y.Z` tags against `node/package.json`, and runs `npm publish` without a long-lived npm token.

The package's npm Trusted Publisher is configured for:

- Provider: GitHub Actions
- GitHub user/organization: `dev-yom1`
- Repository: `S7`
- Workflow filename: `publish-node.yml`

Create Node release tags in the form `node-v0.3.2`. The tag version must exactly match `node/package.json`. Trusted Publishing supplies short-lived OIDC credentials and npm provenance; no `NPM_TOKEN` is required for the publish job.

## Highlights

The Node CLI supports prices, stock, balance, buy, purchase history, task quote/products/active/status/history/items, BYOT quote and execution, Boost, Join, Humanize, `--wait`, `task status --watch`, interactive product selection, a looping interactive menu, `doctor`, update checks and self-update, four UI languages (`en`, `ja`, `ko`, `hi`), JSON/JSONL output, recursive secret masking for human output, retry/backoff, and HTTPS enforcement.

Machine-readable modes are intentionally lossless: `--json`, `--jsonl`, and `--compact` serialize the API response without secret masking or other value changes. Human-readable output masks sensitive values unless `--reveal-secrets` is used.

## Updates

The Node CLI checks the npm Registry entry for `salta7-cli-node` and does not use this repository's GitHub Releases for Node version discovery. This keeps Python release tags such as `v2.5.0` independent from Node releases.

`--json update --check` performs a check only. `--json update --yes` performs the npm update when one is available and emits the final update result as JSON.

## Security

HTTPS is required for API requests. Plain HTTP is accepted only for loopback hosts when `--allow-insecure-http` is explicitly supplied. BYOT token files contain secrets and must not be committed. On POSIX systems, the CLI warns when a token file is readable or writable by group/other users.

## Common examples

```bash
s7-node --lang ja prices
s7-node --token "$SALTA7_TOKEN" balance
s7-node buy product-name 2
s7-node task status JOB_ID --watch
s7-node task boost --mode stock --invite INVITE --boosts 2 --wait
s7-node task humanize --mode byot --tokens-file tokens.txt --random-all --wait
s7-node doctor
s7-node update --check
s7-node update --yes
```

Use `--yes` for non-interactive purchases and updates. Without it, a TTY confirmation prompt is shown. `--no-color` disables ANSI color in human-readable output.
