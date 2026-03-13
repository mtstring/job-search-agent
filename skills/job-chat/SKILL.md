---
name: job-chat
description: 転職活動の相談相手AIエージェント。キャリア相談、複数社比較、面接対策など何でも相談できます。
user-invocable: true
requires:
  bins: [bun]
  env: [ANTHROPIC_API_KEY, DATABASE_URL]
---

# job-chat スキル

転職活動の相談相手AIエージェントです。ユーザーからのメッセージを受け取り、転職エージェントのAIに転送して応答を返します。

## 動作手順

1. ユーザーが `/job-chat <メッセージ>` と入力する
2. 以下のコマンドを実行する：

```
! bun /Users/y-itoyama/Work/ai-agents/job-search-agent/packages/agents/src/cli.ts chat "<ユーザーのメッセージ>"
```

セッションを継続する場合（ユーザーが前回の会話を引き継ぎたい場合や、前回のSESSION IDがある場合）：

```
! bun /Users/y-itoyama/Work/ai-agents/job-search-agent/packages/agents/src/cli.ts chat "<ユーザーのメッセージ>" --session <SESSION_ID>
```

3. コマンドの出力の**1行目**は `SESSION:xxxxxxxx` 形式のセッションIDが含まれる。このセッションIDを記憶しておき、次回の会話で `--session` オプションに渡すことで会話履歴が引き継がれる。

4. 出力の**2行目以降**をそのままDiscordのレスポンスとして返す。セッションID行（`SESSION:...`）は含めない。

## セッション管理

- 初回呼び出し時はセッションIDなしで実行する
- 出力の1行目 `SESSION:xxxxxxxx` をメモしておく
- 同じユーザーが続けて話しかけた場合は `--session xxxxxxxx` を付けて実行する
- セッションIDはDiscordのスレッドまたはチャンネルに紐づけて管理するとよい

## 使用例

ユーザー: `/job-chat 株式会社ABCの面接対策を手伝ってください`

実行コマンド:
```
! bun /Users/y-itoyama/Work/ai-agents/job-search-agent/packages/agents/src/cli.ts chat "株式会社ABCの面接対策を手伝ってください"
```

出力例:
```
SESSION:V1StGXR8_Z5jdHi6B-myT
もちろんです！株式会社ABCの面接対策をお手伝いします。...
```

Discordへの返信: `SESSION:...` 行を除いた本文のみを返す。
