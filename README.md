# job-search-agent

転職支援AIエージェント - OpenClaw Skills として実装

## 概要

このリポジトリは OpenClaw（Discord Bot）のスキルとして動作する転職支援AIエージェントです。
Discordから以下のコマンドで転職活動を管理できます。

## スキル一覧

| スキル | コマンド例 | 説明 |
|--------|-----------|------|
| job-chat | `/job-chat 面接対策を手伝って` | キャリア相談・AIエージェントとの対話 |
| job-status | `/job-status` | 応募状況の一覧表示 |
| job-add | `/job-add --company "株式会社ABC" --position "エンジニア"` | 応募企業の登録 |
| job-reminder | `/job-reminder` | 期限切れタスクの確認 |

## セットアップ

### 1. リポジトリをクローン

```bash
git clone <repo-url> ~/Work/ai-agents/job-search-agent
cd ~/Work/ai-agents/job-search-agent
```

### 2. 依存パッケージをインストール

```bash
bun install
```

### 3. 環境変数を設定

プロジェクトルートに `.env` ファイルを作成：

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
DATABASE_URL=file:./job-search-agent.db
```

- `ANTHROPIC_API_KEY`: Anthropic API キー（[console.anthropic.com](https://console.anthropic.com) で取得）
- `DATABASE_URL`: SQLiteデータベースのパス（libsql形式: `file:./path/to/db.sqlite`）

### 4. データベースのマイグレーション

```bash
cd packages/db
bun run db:push
```

### 5. OpenClaw スキルをインストール

```bash
bash setup-skills.sh
```

このスクリプトは `~/.openclaw/skills/` 配下に各スキルへのシンボリックリンクを作成します。

### 6. OpenClaw を再起動

```bash
# OpenClaw の再起動方法は環境に応じて変更してください
# 例: pm2 restart openclaw
```

## プロジェクト構成

```
job-search-agent/
├── skills/
│   ├── job-chat/SKILL.md       # キャリア相談スキル
│   ├── job-status/SKILL.md     # 応募状況確認スキル
│   ├── job-add/SKILL.md        # 応募企業追加スキル
│   └── job-reminder/SKILL.md  # 期限タスク確認スキル
├── packages/
│   ├── db/                     # データベース層（Drizzle ORM + libsql）
│   ├── agents/
│   │   └── src/
│   │       ├── cli.ts          # CLIエントリポイント（スキルから呼び出される）
│   │       └── orchestrator.ts # AIエージェントオーケストレーター
│   └── mcp-servers/
│       └── job-tracker/        # MCP サーバー
├── setup-skills.sh             # OpenClaw スキルセットアップスクリプト
└── README.md
```

## 開発

```bash
# 型チェック
bun tsc --noEmit

# CLIを直接テスト
bun packages/agents/src/cli.ts chat "こんにちは"
bun packages/agents/src/cli.ts status
bun packages/agents/src/cli.ts add-application --company "テスト株式会社" --position "エンジニア"
bun packages/agents/src/cli.ts overdue-tasks
```
