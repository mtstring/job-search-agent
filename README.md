# job-search-agent

転職活動を支援する Claude Code エージェント。会話するだけで応募企業の管理・タスク管理・キャリア相談ができる。

## できること

- **応募企業の管理** — 会話の中で自動的に応募を登録・ステータス更新
- **タスク管理** — 面接準備・書類提出などのタスクを作成・期限管理
- **面接準備・志望動機書の生成** — knowledge/ の経歴・企業研究をもとに対策資料を作成
- **キャリア相談** — 転職軸の整理、企業比較、意思決定のサポート

## 仕組み

Claude Code の MCP (Model Context Protocol) で応募管理ツールを提供し、`CLAUDE.md` でエージェントの振る舞いを定義している。

```
┌──────────────────────────────────────┐
│  Claude Code                         │
│  ├─ CLAUDE.md（エージェント定義）       │
│  └─ MCP: job-tracker（応募・タスク管理） │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  data/applications/*.md              │
│  （応募企業ごとの Markdown ファイル）    │
│                                      │
│  knowledge/                          │
│  （経歴・企業研究・人脈メモ）            │
└──────────────────────────────────────┘
```

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

### 2. Claude Code の設���

`.claude/settings.example.json` を `.claude/settings.json` にコピー：

```bash
cp .claude/settings.example.json .claude/settings.json
```

### 3. 知識ベースを準備（任意）

`knowledge/` 配下に自分の経歴・転職軸・企業メモを配置すると、志望動機書や面接対策の生成に活用される。

```
knowledge/
├── profile.md          # 経歴・スキル・強み
├── resume.md           # 詳細な職務経歴
├── values.md           # 転職軸・条件・給与希望
└── companies/{会社名}/
    ├── memo.md         # 企業メモ・志望動機
    └── meeting-prep.md # 面接対策
```

### 4. 起動

```bash
claude
```

## プロジェクト構成

```
job-search-agent/
├���─ CLAUDE.md                       # エージェント定義（システムプロンプト）
├── .claude/settings.example.json   # MCP サーバー設定のテンプレート
├── packages/
│   └── mcp-servers/
│       └── job-tracker/            # 応募・タスク管理 MCP Server
│           └── src/index.ts
├── data/
│   └── applications/               # 応募データ（gitignore）
├── knowledge/                      # 経歴・企業研究（gitignore）
└── package.json
```

## データ管理

応募情報は **Markdown + YAML frontmatter** で管理。DB不要。

```markdown
---
id: example-001
company_name: Example株式会社
position: エンジニア
status: interview
applied_at: 2026-01-15
updated_at: 2026-01-20
---

## メモ
企業研究・志望動機など

## タスク
- [x] 書類提出 `id:t001` `priority:high` `completed:2026-01-16`
- [ ] 面接準備 `id:t002` `priority:high` `due:2026-01-25`
```

ステータス遷移: `applied → screening → interview → offer → accepted / rejected`

## MCP ツール

| ツール | 説明 |
|--------|------|
| `create_application` | 応募企業を登録 |
| `update_application_status` | ステータスを更新 |
| `list_applications` | 応募一覧（statusフィルタ可） |
| `create_task` | タスクを作成 |
| `complete_task` | タスクを完了にする |
| `get_overdue_tasks` | 期限超過タスクを取得 |

## 拡張例

このリポジトリはコアの応募管理機能のみを含んでいる。以下のような拡張を自分で追加できる：

- **Discord bot** — Discord 経由でエージェントと会話
- **Gmail 監視デーモン** — 選考メールを自動検知してタスク生成・通知
- **Google Calendar 連携** — 面接予定の自動作成（Claude Code 組み込みの Google Calendar MCP も利用可）

## 技術スタック

- **ランタイム**: Bun
- **言語**: TypeScript
- **AI**: Claude Code
- **プロトコル**: MCP (Model Context Protocol)
- **データ**: Markdown + YAML frontmatter
