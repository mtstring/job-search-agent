# job-search-agent

転職活動を全方位からサポートする AI エージェントシステム。Claude Code をベースに、応募管理・メール監視・面接準備・スケジュール管理を自動化する。

## できること

| 機能 | 実現方法 |
|------|----------|
| **応募企業の管理** | MCP Server（job-tracker）で応募・ステータス更新・タスク管理 |
| **Gmail 自動監視** | gmail-daemon が10分ごとにポーリング → メール分類 → タスク自動生成・返信ドラフト作成 |
| **朝夜の定期レポート** | launchd で毎朝6:30・毎晩20:30に新着メール・タスク状況を Discord 通知 |
| **Discord チャット** | Discord bot 経由で Claude と会話。応募管理・相談が Discord 上で完結 |
| **Google カレンダー連携** | MCP Server 経由で面接予定の作成・確認 |
| **面接準備・志望動機書** | knowledge/ の経歴・企業研究をもとに対策資料を生成 |
| **キャリア相談** | 転職軸・条件の整理、企業比較、意思決定のサポート |

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│  Claude Code（メインエージェント）                      │
│  ├─ CLAUDE.md        … エージェント定義               │
│  ├─ MCP: job-tracker … 応募・タスク管理               │
│  └─ MCP: google-calendar … カレンダー操作             │
└──────────┬──────────────────────────────┬────────────┘
           │                              │
    ┌──────▼──────┐               ┌───────▼───────┐
    │ Discord Bot │               │ Gmail Daemon  │
    │             │◄──────────────│  → メール分類   │
    │  Claude CLI │   Discord通知  │  → タスク生成   │
    │  サブプロセス │               │  → 返信ドラフト  │
    └─────────────┘               └───────────────┘
           │                              │
           ▼                              ▼
    ┌─────────────────────────────────────────────┐
    │  data/applications/*.md （Markdownファイル管理） │
    │  knowledge/            （経歴・企業研究・人脈）   │
    └─────────────────────────────────────────────┘
```

## プロジェクト構成

```
job-search-agent/
├── CLAUDE.md                         # エージェント定義（システムプロンプト）
├── .claude/settings.example.json     # MCP サーバー設定テンプレート
├── packages/
│   ├── mcp-servers/
│   │   └── job-tracker/              # 応募・タスク管理 MCP Server [公開]
│   │       └── src/index.ts
│   ├── discord-bot/                  # Discord bot                [ローカルのみ]
│   │   └── src/
│   │       ├── index.ts              #   メッセージリスナー
│   │       └── claude.ts             #   Claude CLI 呼び出し・セッション管理
│   ├── gmail-daemon/                 # Gmail 監視デーモン          [ローカルのみ]
│   │   └── src/
│   │       ├── index.ts              #   10分間隔ポーリング
│   │       ├── daily-check.ts        #   朝夜の定期チェック → Discord通知
│   │       ├── classifier.ts         #   Claude API でメール分類
│   │       ├── gmail.ts              #   Gmail API ラッパー
│   │       ├── drafter.ts            #   返信ドラフト生成
│   │       └── task-writer.ts        #   メールからタスク自動生成
│   └── mcp-servers/
│       └── google-calendar/          # Google Calendar MCP        [ローカルのみ]
├── scripts/
│   └── run-daily-check.sh            # launchd 用ラッパー          [ローカルのみ]
├── data/
│   └── applications/                 # 応募データ                   [ローカルのみ]
├── knowledge/                        # 経歴・企業研究・人脈          [ローカルのみ]
└── package.json
```

> `[ローカルのみ]` のファイルは `.gitignore` で除外されており、リポジトリには含まれない。

## 使い方

```
「○○社のエンジニアポジションに応募した」→ 自動で登録
「今の応募状況を見せて」              → 一覧を表示
「○○社の選考が一次面接に進んだ」      → ステータスを更新
「面接対策のタスクを追加して」         → タスクを作成
「期限が近いタスクある？」            → 期限超過タスクを確認
```

## セットアップ

### 1. クローン & 依存インストール

```bash
git clone https://github.com/mtstring/job-search-agent.git
cd job-search-agent
bun install
```

### 2. Claude Code の設定

`.claude/settings.example.json` を `.claude/settings.json` にコピー：

```bash
cp .claude/settings.example.json .claude/settings.json
```

### 3. 知識ベースを準備（任意）

`knowledge/` 配下に自分の経歴・転職軸・企業メモを配置すると、志望動機書や面接対策の生成に活用される。

```
knowledge/
├── profile.md              # 経歴・スキル・強み
├── resume.md               # 詳細な職務経歴
├── values.md               # 転職軸・条件・給与希望
├── companies/{会社名}/
│   ├── memo.md             # 企業メモ・志望動機
│   └── meeting-prep.md     # 面接対策
└── networking/
    └── {YYYY-MM-DD}-{name}.md  # ネットワーキング記録
```

### 4. 起動

```bash
claude
```

## データ管理

応募情報は **Markdown + YAML frontmatter** で管理。DB 不要。

```markdown
---
id: example-001
company_name: Example株式会社
position: エンジニア
status: interview
applied_at: 2026-01-15
updated_at: 2026-01-20
email_domain: example.co.jp
---

## メモ
企業研究・志望動機など

## タスク
- [x] 書類提出 `id:t001` `priority:high` `completed:2026-01-16`
- [ ] 面接準備 `id:t002` `priority:high` `due:2026-01-25`
```

ステータス遷移: `applied → screening → interview → offer → accepted / rejected`

## MCP ツール（job-tracker）

| ツール | 説明 |
|--------|------|
| `create_application` | 応募企業を登録 |
| `update_application_status` | ステータスを更新 |
| `list_applications` | 応募一覧（statusフィルタ可） |
| `create_task` | タスクを作成（面接準備・書類提出など） |
| `complete_task` | タスクを完了にする |
| `get_overdue_tasks` | 期限超過タスクを取得 |

## 常駐プロセス（launchd）

macOS の launchd で以下が自動起動・常駐する。ソースコードはリポジトリに含まれないが、自分で同様の構成を作ることができる。

| Label | 種別 | 内容 |
|-------|------|------|
| `com.job-search-agent.discord-bot` | 常駐 | Discord bot — Claude CLI をサブプロセスとして呼び出し |
| `com.job-search-agent.gmail-daemon` | 常駐 | Gmail 10分間隔ポーリング → 分類・タスク生成・通知 |
| `com.job-search-agent.morning-check` | 定時 (6:30) | 朝の定期チェック → Discord 通知 |
| `com.job-search-agent.evening-check` | 定時 (20:30) | 夜の定期チェック → Discord 通知 |

## 技術スタック

- **ランタイム**: Bun
- **言語**: TypeScript
- **AI**: Claude Code + Claude API（メール分類）
- **プロトコル**: MCP (Model Context Protocol)
- **データ**: Markdown + YAML frontmatter（ファイルベース）
- **外部API**: Gmail API, Google Calendar API, Discord.js
- **自動化**: macOS launchd
