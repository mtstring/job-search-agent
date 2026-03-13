---
name: job-reminder
description: 転職活動の期限切れタスクを確認します。期限が過ぎた未完了タスクを一覧表示して通知します。
user-invocable: true
requires:
  bins: [bun]
  env: [DATABASE_URL]
---

# job-reminder スキル

転職活動の期限切れタスクを確認・通知するスキルです。

## 動作手順

1. ユーザーが `/job-reminder` と入力する（またはスケジューラーから定期実行される）
2. 以下のコマンドを実行する：

```
! bun /Users/y-itoyama/Work/ai-agents/job-search-agent/packages/agents/src/cli.ts overdue-tasks
```

3. コマンドの出力をそのままDiscordのレスポンスとして返す。

## 出力フォーマット

期限切れタスクがある場合：
```
## ⚠️ 期限切れタスク

🔴 **面接準備資料の作成** (期限: 2025/3/1)
  株式会社ABC向けの自己PR資料
🟡 **企業研究レポート** (期限: 2025/3/5)
```

期限切れタスクがない場合：
```
期限切れのタスクはありません。
```

## 優先度アイコン

- 🔴 high（高優先度）
- 🟡 medium（中優先度）
- 🟢 low（低優先度）

## 使用例

ユーザー: `/job-reminder`

実行コマンド:
```
! bun /Users/y-itoyama/Work/ai-agents/job-search-agent/packages/agents/src/cli.ts overdue-tasks
```

## 定期実行

このスキルはOpenClawのスケジューラーで毎朝定期実行するように設定することを推奨します。期限切れタスクがある場合のみ通知することで、重要なアクションの見落としを防ぎます。
