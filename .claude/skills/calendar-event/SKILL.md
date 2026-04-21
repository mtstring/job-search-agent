---
name: calendar-event
description: Google Calendar への予定作成・変更ルール
triggers:
  - 「カレンダー確保して」「予定入れて」
  - 面接・面談の日程確定
  - メールから日程を抽出
---

# calendar-event

## 基本

- **Google Calendar が日程の正**（rules/ironclad.md）。作成・確認・削除は API 経由のみ
- 仮押さえがある場合、確定時に仮押さえを削除する
- SPI・適性検査などの期限は **カレンダーのリマインダーイベント** として登録（CronCreate はセッション限りなので不可）

## メールから予定を作るとき

- **元メール本文をカレンダーの詳細欄にそのまま貼る**（後で背景を追えるように）
- 日時・URL・面接官名はタイトル/詳細に含める

## 選考関連の予定を作ったら

必ず **skills/status-overview-sync** を発火する（次回日程の反映）。

## チェックリスト

- [ ] Google Calendar API で作成した（記憶・推測で書いていない）
- [ ] 仮押さえがあった場合は削除した
- [ ] メール由来なら詳細欄に元メール本文を貼った
- [ ] 選考関連なら status-overview.md を更新した
- [ ] 面接関連なら meeting-prep.md の URL 欄と整合している
