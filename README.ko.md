# ⚡ Salta7 CLI — `s7`

[![CI](https://github.com/dev-yom1/S7/actions/workflows/ci.yml/badge.svg)](https://github.com/dev-yom1/S7/actions/workflows/ci.yml)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[English](README.md)** | **[日本語](README.ja.md)** | **한국어** | **[हिन्दी](README.hi.md)**

Salta7 Store API를 터미널에서 편하게 사용할 수 있도록 만든 Python CLI 클라이언트입니다. 다국어 UI, 컬러 출력, 작업 진행 상황 모니터링, JSON 출력, 방향키 기반 대화형 메뉴를 제공합니다.

> **API 문서:** `https://salta7-store.vercel.app/api`

## 주요 기능

- 설치 후 `s7` 명령으로 실행
- ↑/↓ + Enter 대화형 터미널 메뉴
- 영어 / 일본어 / 한국어 / 힌디어 UI
- OS 로케일 자동 감지 + `--lang` 수동 지정
- 컬러 상태 출력 및 진행률 바
- `--json`, `--compact`, `--jsonl` 머신 리더블 출력
- `task status --watch` 및 `--wait` 작업 모니터링
- 동일한 진행 로그 반복 억제 + 주기적 heartbeat
- GET 요청과 idempotent `/buy` 요청의 안전한 자동 재시도
- 일반 출력에서 토큰 등 민감한 값 자동 마스킹
- 상품/기록 목록을 읽기 쉬운 카드 형식으로 표시
- macOS/Linux에서 BYOT 토큰 파일 권한 경고
- `s7 doctor` API/인증 진단
- 대화형 메뉴용 추가 의존성 없음 (`requests`만 런타임 의존성)
- pytest + GitHub Actions CI

## 설치

```bash
git clone https://github.com/dev-yom1/S7.git
cd S7
python -m venv .venv
```

가상환경 활성화:

```bash
# macOS / Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

설치:

```bash
python -m pip install -U pip
python -m pip install .
```

확인:

```bash
s7 --version
s7 doctor
```

개발 환경:

```bash
python -m pip install -e ".[dev]"
pytest
ruff check .
```

## 인증

API 토큰을 셸 히스토리에 남기지 않도록 환경변수 사용을 권장합니다.

```bash
# macOS / Linux
export SALTA7_TOKEN="YOUR_TOKEN"
```

```powershell
# Windows PowerShell
$env:SALTA7_TOKEN="YOUR_TOKEN"
```

Base URL 변경:

```bash
export SALTA7_BASE_URL="https://salta7-store.ngrok.app"
```

`--token`과 `--base-url`을 직접 지정할 수도 있지만, 비밀 값은 환경변수 사용이 더 안전합니다.

## 언어 설정

| 언어 | 코드 | 자동 감지 예시 |
| --- | --- | --- |
| English | `en` | `en_US`, `en_GB` |
| 日本語 | `ja` | `ja_JP` |
| 한국어 | `ko` | `ko_KR` |
| हिन्दी | `hi` | `hi_IN` |

언어 선택 우선순위:

1. `--lang`
2. `SALTA7_LANG`
3. OS 로케일 (`LC_ALL`, `LC_MESSAGES`, `LANG`)
4. 영어 fallback

```bash
s7 --lang ko prices
s7 --lang ja prices
s7 --lang en prices
s7 --lang hi prices
```

환경변수로 고정:

```bash
export SALTA7_LANG=ko
```

`--json`, `--compact`, `--jsonl` 출력은 스크립트 호환성을 위해 번역하지 않고 API 응답을 그대로 유지합니다.

## 대화형 메뉴

TTY에서 다음만 실행하면 메뉴가 열립니다.

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

무엇을 하시겠습니까?
↑/↓로 이동하고 Enter로 선택합니다. q를 누르면 종료합니다.

 › 잔액 확인
   상품 및 가격
   재고 확인
   상품 구매
   구매 내역
   활성 작업
   작업 모니터링
   Boost 작업 생성
   Join 작업 생성
   Humanize 작업 생성
   BYOT 견적
   연결 진단
   종료
```

명시적으로 열기:

```bash
s7 menu
```

stdin/stdout이 TTY가 아닌 경우 `s7`은 일반 help를 출력하므로 CI나 파이프에서 입력 대기로 멈추지 않습니다.

## 일반 출력

```text
⚡ S7 • Boost

[15:17:12] ✓ 작업이 생성되었습니다
           Job ID: job_abc123
           도구: Boost
           모드: STOCK
           요청 수: 14

[15:17:22] ⟳ 실행 중  4/14 전달됨   █████░░░░░░░░░░░
[15:17:32] ⟳ 실행 중 10/14 전달됨   ███████████░░░░░
[15:17:42] ✓ 완료   14/14 전달됨    ████████████████
```

컬러 비활성화:

```bash
s7 --no-color balance
```

표준 `NO_COLOR` 환경변수도 지원합니다.

## JSON 출력

```bash
# 보기 좋은 JSON
s7 --json balance

# 한 줄 JSON
s7 --compact balance

# 스트림용 JSON Lines
s7 --jsonl task status JOB_ID --watch
```

Raw JSON 모드는 API 응답을 그대로 출력하므로 민감한 정보가 포함될 수 있습니다. 신뢰할 수 없는 로그로 전달하지 마세요.

## 민감한 정보 보호

일반 출력에서는 API 토큰, 계정 토큰 등 일반적인 credential 필드를 기본적으로 마스킹합니다.

정확한 값이 꼭 필요한 경우에만:

```bash
s7 --reveal-secrets history-items TX_ID
s7 --reveal-secrets task items JOB_ID
```

## 진단

```bash
s7 doctor
```

```text
⚡ S7 • 진단

[15:29:10] ✓ API 연결 가능
[15:29:10] ✓ 인증 유효
[15:29:10] ✓ Task API 연결 가능
```

## 상품/계정 명령

```bash
s7 prices
s7 stock                       # TTY에서는 목록에서 선택
s7 stock discord-1m-nitro      # 직접 지정 / 스크립트용
s7 balance
s7 history
s7 history-items TX_ID
```

### 구매

TTY에서는 상품과 수량을 생략하고 실시간 `/prices` 목록에서 선택할 수 있습니다.

```bash
s7 buy
```

직접 지정:

```bash
s7 buy discord-1m-nitro 2
```

비대화형 자동화에서 확인을 의도적으로 생략하려면:

```bash
s7 buy discord-1m-nitro 2 --yes
```

`client_tx_id`를 생략하면 CLI가 UUID를 생성합니다. 같은 구매를 재시도할 때는 같은 idempotency key를 재사용할 수 있습니다.

```bash
s7 buy discord-1m-nitro 2 --client-tx-id SAME_ID --yes
```

## 작업 정보

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

## 작업 모니터링

```bash
s7 task status JOB_ID
s7 task status JOB_ID --watch
```

`--watch`는 상태나 진행률이 바뀌었을 때만 출력하고, 오랫동안 변화가 없을 때만 heartbeat를 표시합니다.

```bash
s7 task status JOB_ID --watch --interval 5
```

## Boost

Stock 모드:

```bash
s7 task boost \
  --mode stock \
  --invite discord.gg/abc123 \
  --boosts 14 \
  --wait
```

BYOT 모드:

```bash
s7 task boost \
  --mode byot \
  --invite discord.gg/abc123 \
  --tokens-file tokens.txt \
  --boosts-needed 0 \
  --wait
```

## Join

Stock 모드에서 `--product`를 생략하면 `/task/products?tool=join` 목록에서 선택할 수 있습니다.

```bash
s7 task join \
  --mode stock \
  --invite discord.gg/abc123 \
  --quantity 10 \
  --wait
```

스크립트에서는 `--product PRODUCT_SLUG`를 명시하세요.

BYOT:

```bash
s7 task join \
  --mode byot \
  --invite discord.gg/abc123 \
  --tokens-file tokens.txt \
  --wait
```

## Humanize

Humanize는 CLI 네이티브입니다. 일반 사용에서는 JSON을 직접 작성할 필요가 없습니다.

지원되는 랜덤 필드 전체 적용:

```bash
s7 task humanize \
  --mode stock \
  --quantity 10 \
  --random-all \
  --wait
```

개별 옵션은 `--random-all`보다 우선합니다.

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

로컬 이미지는 CLI가 자동으로 `data:image/...` 형식으로 변환합니다.

```bash
s7 task humanize \
  --mode stock \
  --quantity 2 \
  --avatar-file ./avatar.png \
  --banner-file ./banner.png
```

Avatar URL도 사용할 수 있습니다.

```bash
s7 task humanize --mode stock --quantity 2 \
  --avatar-url "https://example.com/avatar.png" \
  --random-name
```

BYOT에서도 동일한 Humanize 옵션을 사용할 수 있습니다.

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

사용 가능한 프로필 옵션:

```text
--random-all
--random-avatar | --avatar-url URL | --avatar-file PATH
--banner-file PATH | --banner-data DATA_URL
--random-name | --name TEXT
--random-bio | --bio TEXT
--random-pronouns | --pronouns TEXT
--random-hypesquad | --hypesquad bravery|brilliance|balance|1|2|3
```

API 사양상 `banner`는 custom 전용이므로 `--random-all`에 포함되지 않습니다.

기존 JSON 형식도 호환성을 위해 사용할 수 있습니다.

```bash
s7 task humanize --mode stock --product PRODUCT_SLUG --quantity 2 \
  --humanize-json '{"name":{"source":"random"}}'
```

같은 Humanize 플래그를 `task boost`와 `task join`에도 추가할 수 있습니다.

## BYOT 견적

```bash
s7 task byot-quote --tokens-file tokens.txt
s7 task byot-quote --tokens-file tokens.txt --boosts-needed 10 --humanize
```

macOS/Linux에서는 BYOT 파일이 group/other 사용자에게 읽기 가능할 경우 경고합니다. 권장 예시:

```bash
chmod 600 tokens.txt
```

## 재시도 동작

일시적인 `429`, `5xx`, 네트워크 오류에 대해 안전하거나 idempotent한 요청은 기본적으로 최대 3번 시도합니다.

```bash
s7 --retries 5 prices
```

작업 생성 POST는 중복 작업을 방지하기 위해 자동 재시도하지 않습니다. `/buy`는 idempotency key를 사용하므로 재시도할 수 있습니다.

## 전역 옵션

```text
--lang LANG          UI 언어: auto, en, ja, ko, hi
--base-url URL       API Base URL 변경
--token TOKEN        API 토큰 (SALTA7_TOKEN 권장)
--timeout SEC        HTTP timeout
--retries N          안전/idempotent 요청 시도 횟수
--json               보기 좋은 raw JSON
--compact            한 줄 raw JSON
--jsonl               줄 단위 raw JSON
--no-color           ANSI 컬러 비활성화
--reveal-secrets     일반 출력에서 비밀 값 표시
--version            CLI 버전 표시
```

전역 옵션은 명령 앞에 둡니다.

```bash
s7 --json balance
s7 --no-color task active
```

## 프로젝트 구조

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

## 보안 및 책임 있는 사용

- `SALTA7_TOKEN`, BYOT 파일, 전달된 계정/토큰 데이터는 비공개로 관리하세요.
- `.env`, `tokens.txt`, 구매 데이터, credential dump를 커밋하지 마세요.
- 자신이 관리할 권한이 있는 계정, 서버, 리소스에만 자동화를 사용하고 관련 서비스의 규칙을 준수하세요.
- credential 처리 문제를 보고하기 전에 [`SECURITY.md`](SECURITY.md)를 확인하세요.

## 개발 체크

```bash
pytest
ruff check .
python -m compileall -q src
s7 --version
s7 --help
```

## 라이선스

MIT License. 자세한 내용은 [`LICENSE`](LICENSE)를 확인하세요.
