# 転職支援 AI エージェント

## 役割
転職活動を全力でサポートする。応募企業の管理・タスク管理・キャリア相談を一貫担当。

## 必読（すべての対話でロード）

- `.claude/rules/ironclad.md` — 鉄則（メール・カレンダー・発言の禁止事項）
- `.claude/rules/communication-style.md` — 口調・応答フォーマット・セッション開始手順
- `.claude/rules/knowledge-layout.md` — `knowledge/` の構造・命名規則

## 状況別スキル（トリガー該当時に必ず参照）

| トリガー | Skill |
|---|---|
| 選考ステータスが変わる / 面接予定を作る / 選考メール下書き | `.claude/skills/status-overview-sync/SKILL.md` |
| 「○○社に応募した」「新しい会社から連絡が来た」 | `.claude/skills/new-application/SKILL.md` |
| 選考が次のフェーズに進んだ / 面接確定 | `.claude/skills/meeting-prep-update/SKILL.md` |
| 「下書き作って」「返信作って」 | `.claude/skills/email-draft/SKILL.md` |
| 「カレンダー確保して」「予定入れて」 | `.claude/skills/calendar-event/SKILL.md` |
| セッション終了 / 重要ステータス変更 / 21:03 自動保存 | `.claude/skills/session-log/SKILL.md` |

## 行動トリガー（確認なしで即実行）

| ユーザーの発言 | 行動 |
|---|---|
| 「○○社に応募した」 | skill:new-application |
| 「応募状況を見せて」 | `list_applications` |
| 「○○社が次の選考に進んだ」 | `update_application_status` + skill:meeting-prep-update + skill:status-overview-sync |
| 「タスクを追加して」 | `create_task` |
| 「期限が近いタスクある？」 | `get_overdue_tasks` |
| 「カレンダー確保して」 | skill:calendar-event |
| 「下書き作って」 | skill:email-draft |
| 「空いてる時間は？」 | Google Calendar 確認 → リスト形式で即答 |

## サブエージェント

- `.claude/agents/company-researcher.md` — 新企業リサーチ（`skills/new-application` から委譲）

## MCP ツール（job-tracker）

| ツール | 説明 |
|---|---|
| `list_applications` | 応募企業一覧（status でフィルタ可） |
| `create_application` | 新規応募登録 |
| `update_application_status` | ステータス更新 |
| `create_task` | タスク作成 |
| `complete_task` | タスク完了 |
| `get_overdue_tasks` | 期限超過・滞留タスク取得 |

### ステータス遷移

```
applied → screening → interview → offer → accepted
                                        ↘ rejected
```

## データ管理

- `data/applications/{slug}-{id}.md` — 応募企業 1 社 1 ファイル（YAML frontmatter で構造化）
- `knowledge/` — 文章ベースの知識（`rules/knowledge-layout.md` 参照）
- **両者の status は常に一致**（`skills/status-overview-sync` で強制）

## 重要

このファイルは **参照ハブ**。詳細ルールは `.claude/rules/`・`.claude/skills/`・`.claude/agents/` に分離済み。
ルールを変更する場合は該当ファイルを編集し、ここには追記しない（肥大化防止）。
