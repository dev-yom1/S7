# Contributing

Thanks for helping improve Salta7 CLI.

## Development setup

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
python -m pip install -e ".[dev]"
pytest
ruff check .
```

## Pull requests

- Keep changes focused and explain user-visible behavior.
- Add or update tests for parser, rendering, validation, or HTTP behavior when relevant.
- Never commit API tokens, Discord/account tokens, purchased account data, or `.env` files.
- Keep raw API compatibility in `--json`/`--jsonl` modes where practical.
- Update `CHANGELOG.md` for user-visible changes.

## Reporting bugs

Include the CLI version (`s7 --version`), OS, Python version, command shape, and a redacted error message. Do **not** paste credentials or delivered tokens.

## Adding a language

Human-facing translations live in `src/salta7_cli/i18n.py`. Keep command names, option names, JSON keys, and raw API values stable; translate only UI text.

When adding a locale:

- Add the locale to `SUPPORTED_LANGUAGES` and the language alias map.
- Add a complete translation dictionary, with English remaining the fallback.
- Add tests for locale detection, help output, interactive labels, and product/task rendering.
- Do not translate `--json`, `--compact`, or `--jsonl` payload data.
