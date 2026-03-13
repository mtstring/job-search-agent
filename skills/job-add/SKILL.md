---
name: job-add
description: 応募企業を新規登録します。会社名と職種は必須、担当エージェント名とメモは任意です。
user-invocable: true
requires:
  bins: [bun]
  env: [DATABASE_URL]
---

# job-add スキル

転職活動で応募した企業を登録するスキルです。

## 動作手順

1. ユーザーが `/job-add` とともに会社名・職種などを入力する
2. ユーザーの入力から以下の情報をパースする：
   - `--company` または「会社名」：企業名（必須）
   - `--position` または「職種」：職種・ポジション（必須）
   - `--agent` または「エージェント」：担当エージェント名（任意）
   - `--notes` または「メモ」：備考（任意）
3. 以下のコマンドを実行する：

```
! bun /Users/y-itoyama/Work/ai-agents/job-search-agent/packages/agents/src/cli.ts add-application --company "<会社名>" --position "<職種>" [--agent "<エージェント名>"] [--notes "<メモ>"]
```

4. コマンドの出力をそのままDiscordのレスポンスとして返す。

## 入力パターン

ユーザーはフラグ形式でも自然言語でも入力できる。自然言語の場合は情報を抽出してフラグ形式に変換する。

**フラグ形式:**
```
/job-add --company "株式会社ABC" --position "バックエンドエンジニア" --agent "山田太郎" --notes "年収600万以上希望"
```

**自然言語形式:**
```
/job-add 株式会社ABCにバックエンドエンジニアとして応募しました。エージェントは山田さんです。
```

## 使用例

ユーザー: `/job-add --company "株式会社テック" --position "シニアエンジニア"`

実行コマンド:
```
! bun /Users/y-itoyama/Work/ai-agents/job-search-agent/packages/agents/src/cli.ts add-application --company "株式会社テック" --position "シニアエンジニア"
```

出力例:
```
✅ 登録しました: 株式会社テック（シニアエンジニア）
```

## 注意事項

- 会社名（`--company`）と職種（`--position`）は必須項目
- どちらかが不明な場合はユーザーに確認してから実行する
- 引数に空白が含まれる場合は必ずダブルクォートで囲む
