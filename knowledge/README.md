# knowledge/

個人の転職活動データを蓄積するディレクトリ。
**実データはすべて gitignore されており、ローカルにのみ存在します。**

## ファイル構成

```
knowledge/
├── profile.md              # 経歴・スキル・強み
├── resume.md               # 詳細な職務経歴
├── values.md               # 転職軸・条件・給与希望
├── companies/{会社名}/     # 会社ごとにディレクトリを作成
│   ├── memo.md             #   企業メモ・志望動機
│   ├── meeting-prep.md     #   面接・面談対策
│   ├── resume.md           #   会社向けカスタム職歴
│   └── ...                 #   求人票PDF、面談録音テキスト等
├── networking/             # 個人との面談・会食・ランチ記録
│   └── {YYYY-MM-DD}-{name}.md
├── raw/                    # 過去の職歴に関する原本資料
└── _*.template.md          # テンプレート（git管理あり）
```

すべてのファイルは gitignore（`_*.template.md` と `README.md` を除く）。

## 使い分けルール

**企業との面接・面談** → `companies/{会社名}/`
- 企業研究・志望動機・面接準備はここを参照・更新する

**個人との会食・ランチ・ネットワーキング** → `networking/`
- ファイル名: `{YYYY-MM-DD}-{人物slug}.md`
- 人物情報・背景・話したいこと・当日メモ・フォローアップを記録

**過去の職歴資料** → `raw/`
- 前職時代の評価・実績など、職務経歴書の素材になるドキュメント

## セットアップ

テンプレートをコピーして使い始めてください：

```bash
cp knowledge/_profile.template.md knowledge/profile.md
cp knowledge/_resume.template.md knowledge/resume.md
cp knowledge/_values.template.md knowledge/values.md
mkdir -p knowledge/companies/会社名
cp knowledge/_company.template.md knowledge/companies/会社名/memo.md
```

または、Claude Code に話しかけながら自動で蓄積させることもできます。
