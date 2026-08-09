# ⚡ Salta7 CLI — `s7`

[![CI](https://github.com/dev-yom1/S7/actions/workflows/ci.yml/badge.svg)](https://github.com/dev-yom1/S7/actions/workflows/ci.yml)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[English](README.md)** | **日本語** | **[한국어](README.ko.md)** | **[हिन्दी](README.hi.md)**

Salta7 Store API をターミナルから扱うための、見やすく使いやすい Python CLI クライアントです。多言語UI、カラー表示、タスク進捗監視、JSON出力、矢印キーで操作できる対話メニューに対応しています。

> **API リファレンス:** `https://salta7-store.vercel.app/api`

## 主な機能

- インストール後は `s7` コマンドで実行
- ↑/↓ + Enter の対話式メニュー
- 英語 / 日本語 / 韓国語 / ヒンディー語UI
- OSロケール自動判定 + `--lang` で手動切り替え
- カラー付きステータス表示と進捗バー
- `--json` / `--compact` / `--jsonl` の機械可読出力
- `task status --watch` と `--wait` によるリアルタイム監視
- 同じ進捗ログの連続表示を抑制し、必要時のみheartbeat表示
- GET系とidempotentな `/buy` の安全な自動リトライ
- 通常表示ではトークンなどの秘密情報をマスク
- 商品・履歴などの一覧をカード形式で見やすく表示
- BYOTトークンファイルの権限警告（macOS/Linux）
- `s7 doctor` によるAPI・認証診断
- 対話メニュー用の追加依存なし（ランタイム依存は `requests` のみ）
- pytest + GitHub Actions CI

## インストール

```bash
git clone https://github.com/dev-yom1/S7.git
cd S7
python -m venv .venv
```

仮想環境を有効化します。

```bash
# macOS / Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

インストール:

```bash
python -m pip install -U pip
python -m pip install .
```

確認:

```bash
s7 --version
s7 doctor
```

開発用:

```bash
python -m pip install -e ".[dev]"
pytest
ruff check .
```

## 認証

APIトークンをシェル履歴へ直接残さないため、環境変数の利用を推奨します。

```bash
# macOS / Linux
export SALTA7_TOKEN="YOUR_TOKEN"
```

```powershell
# Windows PowerShell
$env:SALTA7_TOKEN="YOUR_TOKEN"
```

Base URL を上書きする場合:

```bash
export SALTA7_BASE_URL="https://salta7-store.ngrok.app"
```

`--token` / `--base-url` を直接指定することもできますが、秘密情報は環境変数の方が安全です。

## 言語設定

対応言語:

| 言語 | コード | 自動判定例 |
| --- | --- | --- |
| English | `en` | `en_US`, `en_GB` |
| 日本語 | `ja` | `ja_JP` |
| 한국어 | `ko` | `ko_KR` |
| हिन्दी | `hi` | `hi_IN` |

言語の優先順位:

1. `--lang`
2. `SALTA7_LANG`
3. OSロケール（`LC_ALL`, `LC_MESSAGES`, `LANG`）
4. 英語へフォールバック

```bash
s7 --lang ja prices
s7 --lang en prices
s7 --lang ko prices
s7 --lang hi prices
```

環境変数で固定する場合:

```bash
export SALTA7_LANG=ja
```

`--json` / `--compact` / `--jsonl` はスクリプト互換性を保つため翻訳されず、APIレスポンスをそのまま出力します。

## 対話式メニュー

TTY上で単に次を実行するとメニューが開きます。

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

何をしますか？
↑/↓で移動、Enterで決定。qで終了します。

 › 残高を確認
   商品・価格一覧
   在庫を確認
   商品を購入
   購入履歴
   実行中タスク
   タスクを監視
   Boostタスクを作成
   Joinタスクを作成
   Humanizeタスクを作成
   BYOT見積もり
   接続診断
   終了
```

明示的に開く場合:

```bash
s7 menu
```

stdin/stdout がTTYではない場合、`s7` は通常のhelpを表示するためCIやパイプ処理でプロンプト待ちになりません。

## 通常表示

```text
⚡ S7 • Boost

[15:17:12] ✓ タスクを作成しました
           ジョブID: job_abc123
           ツール: Boost
           モード: STOCK
           要求数: 14

[15:17:22] ⟳ 実行中  4/14 配信済み   █████░░░░░░░░░░░
[15:17:32] ⟳ 実行中 10/14 配信済み   ███████████░░░░░
[15:17:42] ✓ 完了   14/14 配信済み   ████████████████
```

色を無効化:

```bash
s7 --no-color balance
```

標準の `NO_COLOR` 環境変数にも対応しています。

## JSON出力

```bash
# 整形JSON
s7 --json balance

# 1行JSON
s7 --compact balance

# ストリーム向けJSON Lines
s7 --jsonl task status JOB_ID --watch
```

`--json` / `--compact` / `--jsonl` はAPIレスポンスをそのまま出すため、秘密情報を含む場合があります。信頼できないログへ流さないでください。

## 秘密情報の扱い

通常表示ではAPIトークンやアカウントトークンなどの一般的な資格情報フィールドをマスクします。

明示的に実値が必要な場合のみ:

```bash
s7 --reveal-secrets history-items TX_ID
s7 --reveal-secrets task items JOB_ID
```

## 接続診断

```bash
s7 doctor
```

```text
⚡ S7 • 接続診断

[15:29:10] ✓ APIに接続できます
[15:29:10] ✓ 認証は有効です
[15:29:10] ✓ Task APIに接続できます
```

## 商品・アカウント系コマンド

```bash
s7 prices
s7 stock                       # TTYでは商品を選択
s7 stock discord-1m-nitro      # 直接指定 / スクリプト向け
s7 balance
s7 history
s7 history-items TX_ID
```

### 購入

TTYなら商品名と数量を省略して、一覧から選択できます。

```bash
s7 buy
```

直接指定:

```bash
s7 buy discord-1m-nitro 2
```

非対話環境で意図的に確認を省略する場合:

```bash
s7 buy discord-1m-nitro 2 --yes
```

`client_tx_id` を省略するとCLIがUUIDを生成します。同じ購入を再試行する場合は同じidempotency keyを再利用できます。

```bash
s7 buy discord-1m-nitro 2 --client-tx-id SAME_ID --yes
```

## タスク情報

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

## タスク監視

```bash
s7 task status JOB_ID
s7 task status JOB_ID --watch
```

`--watch` は状態や進捗が変化した時だけ表示し、変化が長時間ない場合のみheartbeatを表示します。

```bash
s7 task status JOB_ID --watch --interval 5
```

## Boost

Stockモード:

```bash
s7 task boost \
  --mode stock \
  --invite discord.gg/abc123 \
  --boosts 14 \
  --wait
```

BYOTモード:

```bash
s7 task boost \
  --mode byot \
  --invite discord.gg/abc123 \
  --tokens-file tokens.txt \
  --boosts-needed 0 \
  --wait
```

## Join

Stockモードでは `--product` を省略すると `/task/products?tool=join` から商品を選択できます。

```bash
s7 task join \
  --mode stock \
  --invite discord.gg/abc123 \
  --quantity 10 \
  --wait
```

スクリプトでは `--product PRODUCT_SLUG` を明示してください。

BYOT:

```bash
s7 task join \
  --mode byot \
  --invite discord.gg/abc123 \
  --tokens-file tokens.txt \
  --wait
```

## Humanize

HumanizeはCLIネイティブです。通常利用ではJSONを書く必要はありません。

対応項目をすべてランダム化:

```bash
s7 task humanize \
  --mode stock \
  --quantity 10 \
  --random-all \
  --wait
```

個別指定は `--random-all` より優先されます。

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

ローカル画像はCLIが自動で `data:image/...` 形式へ変換します。

```bash
s7 task humanize \
  --mode stock \
  --quantity 2 \
  --avatar-file ./avatar.png \
  --banner-file ./banner.png
```

AvatarはURLも指定できます。

```bash
s7 task humanize --mode stock --quantity 2 \
  --avatar-url "https://example.com/avatar.png" \
  --random-name
```

BYOTでも同じHumanizeオプションを利用できます。

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

利用可能なプロフィールオプション:

```text
--random-all
--random-avatar | --avatar-url URL | --avatar-file PATH
--banner-file PATH | --banner-data DATA_URL
--random-name | --name TEXT
--random-bio | --bio TEXT
--random-pronouns | --pronouns TEXT
--random-hypesquad | --hypesquad bravery|brilliance|balance|1|2|3
```

`banner` はAPI仕様上customのみのため、`--random-all` では変更しません。

旧JSON形式も互換用として利用できます。

```bash
s7 task humanize --mode stock --product PRODUCT_SLUG --quantity 2 \
  --humanize-json '{"name":{"source":"random"}}'
```

Humanizeオプションは `task boost` / `task join` に追加することもできます。

## BYOT見積もり

```bash
s7 task byot-quote --tokens-file tokens.txt
s7 task byot-quote --tokens-file tokens.txt --boosts-needed 10 --humanize
```

macOS/LinuxではBYOTファイルがgroup/otherから読める場合に警告します。推奨例:

```bash
chmod 600 tokens.txt
```

## リトライ動作

一時的な `429` / `5xx` / ネットワークエラーに対して、安全またはidempotentなリクエストは既定で最大3回試行します。

```bash
s7 --retries 5 prices
```

タスク作成POSTは二重実行を避けるため自動再試行しません。`/buy` はidempotency keyを利用するため再試行できます。

## グローバルオプション

```text
--lang LANG          UI言語: auto, en, ja, ko, hi
--base-url URL       API Base URLを上書き
--token TOKEN        APIトークン（SALTA7_TOKEN推奨）
--timeout SEC        HTTPタイムアウト
--retries N          安全/idempotentなリクエストの試行回数
--json               整形した生JSON
--compact            1行の生JSON
--jsonl               改行区切りJSON
--no-color           ANSIカラーを無効化
--reveal-secrets     通常表示で秘密値を表示
--version            CLIバージョンを表示
```

グローバルオプションはコマンドの前に指定します。

```bash
s7 --json balance
s7 --no-color task active
```

## プロジェクト構成

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

## セキュリティと責任ある利用

- `SALTA7_TOKEN`、BYOTファイル、取得したアカウント/トークン情報は非公開で管理してください。
- `.env`、`tokens.txt`、購入データ、資格情報ダンプをコミットしないでください。
- 自分が管理権限を持つアカウント・サーバー・リソースにのみ自動化を使用し、各サービスのルールに従ってください。
- 資格情報の扱いに関する問題を報告する前に [`SECURITY.md`](SECURITY.md) を確認してください。

## 開発チェック

```bash
pytest
ruff check .
python -m compileall -q src
s7 --version
s7 --help
```

## ライセンス

MIT License。詳しくは [`LICENSE`](LICENSE) を参照してください。
