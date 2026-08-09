# Changelog

All notable changes to this project are documented here.

## [2.4.0] - 2026-08-09

### Added
- Korean (`ko`) and Hindi (`hi`) UI translations, including menus, help, prompts, diagnostics, errors, task status text, and common field labels.
- Automatic locale detection for common `ko_KR` and `hi_IN` environments plus language aliases.
- Translation integrity tests that require identical key coverage and formatting placeholders across all supported languages.
- Native affirmative input support for Korean (`네` / `예`) and Hindi (`हाँ` / `हां`) confirmation prompts.

### Changed
- Global `--lang` choices are now sourced from one `SUPPORTED_LANGUAGES` definition instead of being duplicated in the parser.
- Nested lists of API records now use the same readable card layout as top-level product/history lists instead of falling back to dense one-line records.
- Korean and Hindi locale tables live in dedicated modules to keep the i18n core maintainable.
- Terminal display-width handling now accounts for Devanagari combining marks as well as East Asian wide characters.
- Ruff CI rules focus on syntax/import correctness instead of style rules that conflict with long localized UI strings.

## [2.3.0] - 2026-08-09

### Added
- CLI-native Humanize options: `--random-all`, per-field random flags, custom name/bio/pronouns, HypeSquad aliases, avatar URLs, and local avatar/banner image files.
- Automatic local image conversion to API-compatible `data:image/...;base64,...` values.
- Interactive Humanize setup with an all-random preset or field-by-field configuration.
- Humanize configuration unit tests and task-created field summaries.

### Changed
- `--humanize-json` is now an optional advanced/backward-compatibility path instead of the primary Humanize interface.
- Humanize tasks require at least one configured field, with a CLI-friendly error explaining how to provide one.

## [2.2.0] - 2026-08-09

### Added
- English and Japanese human-facing UI translations.
- Automatic language detection from `SALTA7_LANG`, `LC_ALL`, `LC_MESSAGES`, and `LANG`.
- Global `--lang auto|en|ja` override.
- Localized interactive menus, prompts, help text, status logs, diagnostics, errors, and common product/task field labels.
- Translation-focused tests and `SALTA7_LANG` in `.env.example`.

### Changed
- JSON/JSONL output remains intentionally untranslated so scripts receive stable API data regardless of UI language.
- Command and option names remain English for backward-compatible automation.

## [2.1.0] - 2026-08-09

### Added
- Product pickers backed by live API list responses for `s7 stock` and `s7 buy` when the product slug is omitted in a TTY.
- Stock Join/Humanize product pickers backed by `/task/products` when `--product` is omitted in a TTY.
- Interactive stock and purchase flows now select products instead of requiring manual slug entry.

### Changed
- `stock` and `buy` positional arguments are optional for interactive terminal use while remaining fully scriptable with explicit slugs.
- Stock Join/Humanize can prompt for missing quantities in a TTY; non-interactive and JSON modes still require explicit values.

## [2.0.1] - 2026-08-09

### Changed
- List responses now render dictionary items as readable terminal cards instead of dense one-line `key=value` output.
- Long fields such as descriptions and warranties wrap to the current terminal width.
- Empty fields are hidden from human-friendly output.
- Common abbreviations such as ID, API, URL, and BYOT keep their expected capitalization.

## [2.0.0] - 2026-08-09

### Added
- Arrow-key interactive menu when running `s7` in a terminal.
- `s7 menu` explicit interactive entry point.
- `s7 doctor` connectivity/authentication checks.
- `--jsonl` streaming output for watch/wait workflows.
- `--retries` for safe/idempotent HTTP requests.
- Sensitive-field redaction in human-friendly output.
- BYOT token-file permission warnings on POSIX systems.
- Purchase confirmation with `--yes` for automation.
- Package layout under `src/salta7_cli`.
- Test suite and GitHub Actions CI.

### Changed
- Watch mode now suppresses duplicate progress lines and emits a heartbeat periodically.
- Safe GET requests and idempotent `/buy` requests retry transient failures.
- Project metadata and documentation prepared for public GitHub distribution.

## [1.2.0] - 2026-08-09
- Added branding, ANSI color, progress bars, `s7` console entry point, and `--no-color`.
