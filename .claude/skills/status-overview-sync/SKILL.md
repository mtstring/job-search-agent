---
name: status-overview-sync
description: knowledge/status-overview.md と data/applications/ の同期。選考ステータスが変わるあらゆるタイミングで必ず呼ぶ
triggers:
  - update_application_status が呼ばれた
  - create_application が呼ばれた
  - 選考結果（通過・見送り）の連絡を処理した
  - 面接・面談のカレンダー予定を作成/変更した
  - 選考進捗に関わるメール下書きを作成した
  - 音声メモのサマリーを作成した（面談・面接の結果反映）
---

# status-overview-sync

**目的**: `knowledge/status-overview.md` と `data/applications/{slug}-{id}.md` のステータスを**常に一致**させる。片方だけ更新するとすぐ不整合になる。

## トリガーと行動

以下のいずれかが発生したら、**確認なしで即座に両ファイルを更新する**：

| 発生イベント | 更新対象 |
|---|---|
| `update_application_status` 呼び出し | 両ファイルの status 行 |
| `create_application` 呼び出し | 両ファイルに新規行/ファイル追加 |
| 選考結果の連絡（通過/見送り） | 両ファイルの status 行 |
| 面接・面談のカレンダー予定作成 | `status-overview.md` の該当行（次回日程） |
| 選考関連のメール下書き作成 | `status-overview.md` の該当行（最新アクション） |

## 手順

1. 該当企業の slug と id を確認（`data/applications/` を ls して判断）
2. `knowledge/status-overview.md` の該当行のみ書き換える（**全体を書き直さない**）
3. `data/applications/{slug}-{id}.md` の frontmatter（`status`, `updated_at`）を同時に更新
4. 両ファイルの status が一致しているか確認

## 禁止事項

- **片方だけ更新して終わる**（不整合の原因）
- **該当行以外を書き換える**（他社の行に手を入れない）
- **新しい slug を日本語で作る**（rules/knowledge-layout.md 参照）

## 応募ステータス遷移

```
applied → screening → interview → offer → accepted
                                        ↘ rejected
```

## チェックリスト（完了前に確認）

- [ ] `knowledge/status-overview.md` の該当行を更新した
- [ ] `data/applications/{slug}-{id}.md` の frontmatter を更新した
- [ ] 両者の status 値が一致している
- [ ] updated_at は今日の日付になっている
