# knowledge/

個人の転職活動データを蓄積するディレクトリ。
**実データはすべて gitignore されており、ローカルにのみ存在します。**

## ファイル構成

```
knowledge/
├── profile.md                       # 経歴・スキル・強み
├── resume.md                        # 詳細な職務経歴
├── values.md                        # 転職軸・条件・給与希望
├── thoughts.md                      # 日々の考え・気づき
├── status-overview.md               # 全社の選考ステータス一覧（自動更新）
├── companies/
│   └── {英語slug}/                  # 例: example-corp, acme-tech
│       ├── company-profile.md       #   企業プロフィール・志望動機
│       ├── meeting-prep.md          #   面接対策（最新を最上部に追記）
│       ├── resume.md                #   会社向けカスタム職歴
│       └── ...                      #   面談録音テキスト等
├── networking/                      # 個人との会食・面談記録
│   └── {YYYY-MM-DD}-{name}.md
└── raw/                             # 過去の職歴に関する原本資料
```

`README.md` 以外は gitignore 対象。

## ルール・運用は skills 化されています

knowledge/ の構造・命名規則・更新ルールは Claude Code の skill / rule として `.claude/` 配下に分離・管理しています。

| 内容 | 参照先 |
|---|---|
| ディレクトリ構造・slug 命名規則・使い分け | [`.claude/rules/knowledge-layout.md`](../.claude/rules/knowledge-layout.md) |
| 新規応募時に作成する成果物（4つ） | [`.claude/skills/new-application/SKILL.md`](../.claude/skills/new-application/SKILL.md) |
| `meeting-prep.md` の追記ルール（最新を最上部） | [`.claude/skills/meeting-prep-update/SKILL.md`](../.claude/skills/meeting-prep-update/SKILL.md) |
| `status-overview.md` ⇄ `data/applications/` 同期 | [`.claude/skills/status-overview-sync/SKILL.md`](../.claude/skills/status-overview-sync/SKILL.md) |
| 新企業リサーチの委譲先 | [`.claude/agents/company-researcher.md`](../.claude/agents/company-researcher.md) |

## セットアップ

Claude Code に話しかけながら自動で蓄積するのが基本フローです：

```
「○○社に応募した」
→ skill:new-application が発火し、knowledge/companies/{slug}/ が作成される
```

手動で初期ファイルを作りたい場合は、空のテキストファイルから始めて、対話の中で Claude に追記を依頼してください。
