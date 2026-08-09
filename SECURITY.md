# Security policy

## Secrets

Salta7 CLI handles API tokens and may handle account/token files. Treat these as credentials.

- Prefer `SALTA7_TOKEN` over `--token` so the token is not stored in shell history.
- Keep BYOT files private; on macOS/Linux, `chmod 600 tokens.txt` is recommended.
- Human-friendly output masks common secret fields by default.
- `--json`, `--jsonl`, and `--reveal-secrets` may expose raw sensitive API data. Redirect them only to trusted locations.
- Never attach real credentials to public GitHub issues.

## Vulnerability reports

If you discover a vulnerability that could expose credentials or cause unintended purchases/tasks, report it privately to the repository maintainer rather than opening a public issue containing exploit details or secrets.
