# job-search-agent

転職活動を支援する Claude Code エージェント。会話するだけで応募企業の管理・タスク管理・キャリア相談ができます。

## 使い方

```bash
cd ~/Work/ai-agents/job-search-agent
claude
```

起動したら、普通に話しかけるだけでOKです。

```
「○○社のエンジニアポジションに応募した」
→ 自動でDBに登録

「今の応募状況を見せて」
→ 一覧を表示

「○○社の選考が一次面接に進んだ」
→ ステータスを更新

「面接対策のタスクを追加して」
→ タスクを登録

「期限が近いタスクある？」
→ 期限超過・滞留タスクを確認
```

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/mtstring/job-search-agent.git
cd job-search-agent
```

### 2. 依存パッケージをインストール

```bash
bun install
```

### 3. データベースを初期化

```bash
cd packages/db && bun run db:push && cd ../..
```

### 4. 起動

```bash
claude
```

> **Note:** Claude Code を使う場合、`ANTHROPIC_API_KEY` は不要です。Claude Code の認証がそのまま使われます。

## 知識ベース（任意）

`knowledge/` 配下に自分の経歴・転職軸・企業メモを書いておくと、志望動機書や職務経歴書の生成に活用されます。テンプレートを参考にしてください。

```
knowledge/
├── _profile.template.md    # 経歴・スキルのテンプレート
├── _resume.template.md     # 職務経歴書のテンプレート
├── _values.template.md     # 転職軸・条件のテンプレート
└── _company.template.md    # 企業メモのテンプレート
```

テンプレートをコピーして `_` を外したファイル名で保存してください（例: `profile.md`）。知識ベースのファイルは `.gitignore` されており、リポジトリには含まれません。

## プロジェクト構成

```
job-search-agent/
├── CLAUDE.md                   # エージェント定義（Claude Code用）
├── .claude/settings.json       # MCPサーバー設定
├── knowledge/                  # 個人の経歴・企業メモ（gitignore）
├── packages/
│   ├── db/                     # データベース層（Drizzle ORM + libsql）
│   └── mcp-servers/
│       └── job-tracker/        # MCP サーバー（ツール実装）
└── package.json
```
