# ⚡ Salta7 CLI — `s7`

[![CI](https://github.com/dev-yom1/S7/actions/workflows/ci.yml/badge.svg)](https://github.com/dev-yom1/S7/actions/workflows/ci.yml)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[English](README.md)** | **[日本語](README.ja.md)** | **[한국어](README.ko.md)** | **हिन्दी**

Salta7 Store API को टर्मिनल से आसानी से इस्तेमाल करने के लिए बनाया गया एक polished Python CLI client। इसमें बहुभाषी UI, रंगीन आउटपुट, task progress monitoring, JSON modes और arrow-key interactive menu शामिल हैं।

> **API reference:** `https://salta7-store.vercel.app/api`

## मुख्य फीचर्स

- इंस्टॉल होने के बाद `s7` कमांड
- ↑/↓ + Enter वाला interactive terminal menu
- English / Japanese / Korean / Hindi UI
- OS locale auto-detection + `--lang` override
- रंगीन status output और progress bar
- `--json`, `--compact`, `--jsonl` machine-readable modes
- `task status --watch` और `--wait` task monitoring
- duplicate progress logs को दबाना और समय-समय पर heartbeat दिखाना
- GET requests और idempotent `/buy` calls के लिए safe retries
- सामान्य आउटपुट में tokens जैसी संवेदनशील values को mask करना
- products/history जैसी lists को readable card format में दिखाना
- macOS/Linux पर BYOT token-file permission warning
- `s7 doctor` से API/auth diagnostics
- interactive menu के लिए कोई अतिरिक्त dependency नहीं; runtime में केवल `requests`
- pytest + GitHub Actions CI

## इंस्टॉलेशन

```bash
git clone https://github.com/dev-yom1/S7.git
cd S7
python -m venv .venv
```

Virtual environment activate करें:

```bash
# macOS / Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

इंस्टॉल करें:

```bash
python -m pip install -U pip
python -m pip install .
```

जाँचें:

```bash
s7 --version
s7 doctor
```

Development के लिए:

```bash
python -m pip install -e ".[dev]"
pytest
ruff check .
```

## Authentication

API token को shell history में सीधे रखने के बजाय environment variable का उपयोग करना बेहतर है।

```bash
# macOS / Linux
export SALTA7_TOKEN="YOUR_TOKEN"
```

```powershell
# Windows PowerShell
$env:SALTA7_TOKEN="YOUR_TOKEN"
```

Base URL override:

```bash
export SALTA7_BASE_URL="https://salta7-store.ngrok.app"
```

`--token` और `--base-url` सीधे भी दिए जा सकते हैं, लेकिन secrets के लिए environment variables सुरक्षित हैं।

## भाषा सेटिंग

| भाषा | Code | Auto-detect उदाहरण |
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

```bash
s7 --lang hi prices
s7 --lang ja prices
s7 --lang ko prices
s7 --lang en prices
```

Environment variable से हिन्दी स्थायी रूप से चुनें:

```bash
export SALTA7_LANG=hi
```

`--json`, `--compact`, और `--jsonl` आउटपुट translate नहीं होते; script compatibility के लिए API response जस का तस रहता है।

## Interactive menu

TTY में सिर्फ यह चलाएँ:

```bash
s7
```

```text
   _____  _____
  / ___/ /__  /
  \__ \    / /
 ___/ /   / /
/____/   /_/
  S A L T A 7   C L I  v2.4.0

आप क्या करना चाहते हैं?
↑/↓ से चलें, Enter से चुनें। बाहर निकलने के लिए q दबाएँ।

 › बैलेंस देखें
   उत्पाद और कीमतें
   स्टॉक देखें
   उत्पाद खरीदें
   खरीद इतिहास
   सक्रिय task
   task मॉनिटर करें
   Boost task बनाएँ
   Join task बनाएँ
   Humanize task बनाएँ
   BYOT quote
   कनेक्शन जाँच
   बाहर निकलें
```

स्पष्ट रूप से menu खोलने के लिए:

```bash
s7 menu
```

stdin/stdout TTY न होने पर `s7` सामान्य help दिखाता है, इसलिए CI या pipes में input prompt पर नहीं अटकता।

## Human-friendly output

```text
⚡ S7 • Boost

[15:17:12] ✓ Task बनाया गया
           Job ID: job_abc123
           Tool: Boost
           Mode: STOCK
           Requested: 14

[15:17:22] ⟳ चल रहा है  4/14 delivered   █████░░░░░░░░░░░
[15:17:32] ⟳ चल रहा है 10/14 delivered   ███████████░░░░░
[15:17:42] ✓ पूरा हुआ 14/14 delivered    ████████████████
```

रंग बंद करने के लिए:

```bash
s7 --no-color balance
```

Standard `NO_COLOR` environment variable भी supported है।

## JSON आउटपुट

```bash
# Pretty JSON
s7 --json balance

# One-line JSON
s7 --compact balance

# Streaming के लिए JSON Lines
s7 --jsonl task status JOB_ID --watch
```

Raw JSON modes API response जस का तस दिखाते हैं और sensitive data शामिल हो सकता है। इसे untrusted logs में pipe न करें।

## Secrets की सुरक्षा

Human-readable output में API tokens और account tokens जैसे credential fields default रूप से mask किए जाते हैं।

Exact values जानबूझकर देखने हों तभी:

```bash
s7 --reveal-secrets history-items TX_ID
s7 --reveal-secrets task items JOB_ID
```

## Diagnostics

```bash
s7 doctor
```

```text
⚡ S7 • जाँच

[15:29:10] ✓ API उपलब्ध है
[15:29:10] ✓ Authentication valid है
[15:29:10] ✓ Task API उपलब्ध है
```

## Product / account commands

```bash
s7 prices
s7 stock                       # TTY में list से चुनें
s7 stock discord-1m-nitro      # direct / scripts के लिए
s7 balance
s7 history
s7 history-items TX_ID
```

### खरीदना

TTY में product और quantity छोड़कर live `/prices` list से चुन सकते हैं।

```bash
s7 buy
```

Direct form:

```bash
s7 buy discord-1m-nitro 2
```

Non-interactive automation में confirmation जानबूझकर skip करने के लिए:

```bash
s7 buy discord-1m-nitro 2 --yes
```

`client_tx_id` न देने पर CLI UUID बनाता है। उसी खरीद को retry करते समय वही idempotency key reuse की जा सकती है।

```bash
s7 buy discord-1m-nitro 2 --client-tx-id SAME_ID --yes
```

## Task जानकारी

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

## Task monitor करना

```bash
s7 task status JOB_ID
s7 task status JOB_ID --watch
```

`--watch` केवल status/progress बदलने पर नई लाइन दिखाता है। लंबे समय तक बदलाव न होने पर occasional heartbeat दिखता है।

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

## Join

Stock mode में `--product` छोड़ने पर `/task/products?tool=join` list से product चुना जा सकता है।

```bash
s7 task join \
  --mode stock \
  --invite discord.gg/abc123 \
  --quantity 10 \
  --wait
```

Scripts में `--product PRODUCT_SLUG` explicitly दें।

BYOT:

```bash
s7 task join \
  --mode byot \
  --invite discord.gg/abc123 \
  --tokens-file tokens.txt \
  --wait
```

## Humanize

Humanize CLI-native है — सामान्य उपयोग में JSON लिखने की जरूरत नहीं है।

API के randomizable fields को randomize करें:

```bash
s7 task humanize \
  --mode stock \
  --quantity 10 \
  --random-all \
  --wait
```

Explicit field options `--random-all` पर प्राथमिकता लेते हैं।

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

Local images को CLI खुद API-compatible `data:image/...` format में बदलता है।

```bash
s7 task humanize \
  --mode stock \
  --quantity 2 \
  --avatar-file ./avatar.png \
  --banner-file ./banner.png
```

Avatar URL भी दे सकते हैं:

```bash
s7 task humanize --mode stock --quantity 2 \
  --avatar-url "https://example.com/avatar.png" \
  --random-name
```

BYOT में भी वही Humanize flags काम करते हैं।

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

API के अनुसार `banner` custom-only है, इसलिए `--random-all` banner को नहीं बदलता।

पुराना JSON format compatibility के लिए उपलब्ध है:

```bash
s7 task humanize --mode stock --product PRODUCT_SLUG --quantity 2 \
  --humanize-json '{"name":{"source":"random"}}'
```

यही Humanize flags `task boost` और `task join` में भी जोड़े जा सकते हैं।

## BYOT quote

```bash
s7 task byot-quote --tokens-file tokens.txt
s7 task byot-quote --tokens-file tokens.txt --boosts-needed 10 --humanize
```

macOS/Linux पर CLI चेतावनी देता है अगर BYOT file group/other users द्वारा पढ़ी जा सकती है। सामान्य private permission:

```bash
chmod 600 tokens.txt
```

## Retry behavior

Temporary `429`, `5xx`, और network errors के लिए safe/idempotent requests default रूप से अधिकतम 3 बार कोशिश करते हैं।

```bash
s7 --retries 5 prices
```

Task creation POST automatically retry नहीं किया जाता, ताकि duplicate tasks न बनें। `/buy` idempotency key इस्तेमाल करता है इसलिए retry किया जा सकता है।

## Global options

```text
--lang LANG          UI language: auto, en, ja, ko, hi
--base-url URL       API Base URL override
--token TOKEN        API token; SALTA7_TOKEN recommended
--timeout SEC        HTTP timeout
--retries N          Safe/idempotent request attempts
--json               Pretty raw JSON
--compact            One-line raw JSON
--jsonl               Newline-delimited raw JSON
--no-color           ANSI colors बंद करें
--reveal-secrets     Human output में secret values दिखाएँ
--version            CLI version दिखाएँ
```

Global options command से पहले आते हैं:

```bash
s7 --json balance
s7 --no-color task active
```

## Project structure

```text
S7/
├── src/salta7_cli/
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

## सुरक्षा और जिम्मेदार उपयोग

- `SALTA7_TOKEN`, BYOT files और delivered account/token data को private रखें।
- `.env`, `tokens.txt`, खरीदा हुआ account data या raw credential dumps commit न करें।
- Automation केवल उन accounts, servers और resources पर चलाएँ जिन्हें manage करने की आपको अनुमति है, और संबंधित services के नियमों का पालन करें।
- Credential-handling issues report करने से पहले [`SECURITY.md`](SECURITY.md) देखें।

## Development checks

```bash
pytest
ruff check .
python -m compileall -q src
s7 --version
s7 --help
```

## License

MIT License. विवरण के लिए [`LICENSE`](LICENSE) देखें।
