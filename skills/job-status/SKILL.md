---
name: job-status
description: 転職活動の応募状況を一覧表示します。ステータスごとに応募企業をグループ化して見やすく表示します。
user-invocable: true
requires:
  bins: [bun]
  env: [DATABASE_URL]
---

# job-status スキル

転職活動の応募状況を一覧表示するスキルです。

## 動作手順

1. ユーザーが `/job-status` または `/job-status --filter <ステータス>` と入力する
2. 以下のコマンドを実行する：

**全件表示:**
```
! bun /Users/y-itoyama/Work/ai-agents/job-search-agent/packages/agents/src/cli.ts status
```

**ステータスでフィルタリング:**
```
! bun /Users/y-itoyama/Work/ai-agents/job-search-agent/packages/agents/src/cli.ts status --filter <ステータス>
```

3. コマンドの出力をそのままDiscordのレスポンスとして返す。

## フィルタリング可能なステータス

- `applied` - 応募済み
- `screening` - 書類選考中
- `interview` - 面接中
- `offer` - 内定
- `rejected` - 不採用
- `accepted` - 承諾済み

## 使用例

ユーザー: `/job-status`
実行コマンド:
```
! bun /Users/y-itoyama/Work/ai-agents/job-search-agent/packages/agents/src/cli.ts status
```

ユーザー: `/job-status --filter interview`
実行コマンド:
```
! bun /Users/y-itoyama/Work/ai-agents/job-search-agent/packages/agents/src/cli.ts status --filter interview
```
