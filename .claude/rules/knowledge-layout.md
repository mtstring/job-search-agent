---
name: knowledge/ レイアウト規則
description: knowledge/ 配下のディレクトリ構造・命名規則・使い分け。守れないと情報が散逸する
enforcement: always
triggers: [knowledge/, companies/, meeting-prep, company-profile, networking]
---

# knowledge/ レイアウト規則

個人情報・経歴・思考・企業研究を蓄積する Markdown 群。gitignore 済み（ローカルのみ）。

## ディレクトリ構造（遵守必須）

```
knowledge/
├── profile.md                      # 経歴・スキル・強み
├── resume.md                       # 詳細な職務経歴
├── values.md                       # 転職軸・条件・給与希望
├── thoughts.md                     # 日々の考え・気づき
├── status-overview.md              # 全社の選考ステータス俯瞰（★ skills/status-overview-sync 参照）
├── companies/
│   └── {英語slug}/                 # 例: example-corp, acme-tech
│       ├── company-profile.md      # 企業プロフィール・志望動機
│       ├── meeting-prep.md         # 面接対策（★ skills/meeting-prep-update 参照）
│       ├── resume.md               # 会社向けカスタム職歴
│       └── ...                     # 書き起こし等
└── networking/
    └── {YYYY-MM-DD}-{人物slug}.md  # 個人との面談・会食・ランチ 1 件 1 ファイル
```

## 会社ディレクトリ命名規則（厳守）

- **英語 slug のみ**。日本語名は使わない
  - ○ `example-corp`, `acme-tech`, `foo-bar-inc`
  - ✗ `エグザンプル株式会社`, `アクメ`, `フーバー`
- **`unknown/` フォルダを作らない**
- 既存ディレクトリを確認してから新規作成する（重複防止）

## 使い分け

### 企業との面接・面談 → `knowledge/companies/{slug}/`
- 企業研究・志望動機・面接準備はここを参照・更新
- `meeting-prep.md` の更新は **skills/meeting-prep-update** に従う（追記モード厳守）

### 個人との会食・ランチ・ネットワーキング → `knowledge/networking/`
- ファイル名: `{YYYY-MM-DD}-{人物slug}.md`
- 人物情報・背景・話したいこと・当日メモ・フォローアップを記録
- **会話で個人の名前が出たら、まずここを検索する**

## 運用

- ユーザーの経歴・考えが会話に出たら、記録を積極的に提案する
- 志望動機書・職務経歴書を生成する際は `knowledge/profile.md` + `knowledge/companies/{slug}/` を参照
- 新しい会社は `knowledge/companies/{slug}/` を作成し、その中にファイルを配置

## data/applications/ との関係

`data/applications/{slug}-{id}.md` は応募企業 1 社 1 ファイルの **構造化データ**（YAML frontmatter）。
`knowledge/` は **人間が読むための文章**。両者の slug は一致させる。

ステータス変更時の同期は **skills/status-overview-sync** を必ず参照。
