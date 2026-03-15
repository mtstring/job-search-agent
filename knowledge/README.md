# knowledge/

個人の転職活動データを蓄積するディレクトリ。
**実データはすべてgitignoreされており、ローカルにのみ存在します。**

## ファイル構成

| ファイル | 内容 | git管理 |
|---------|------|---------|
| `profile.md` | 経歴・スキル・強み | ❌ |
| `resume.md` | 詳細な職務経歴 | ❌ |
| `values.md` | 転職軸・条件・給与希望 | ❌ |
| `thoughts.md` | 日々の考え・気づき | ❌ |
| `companies/{name}.md` | 各社メモ・志望動機 | ❌ |

## セットアップ

テンプレートをコピーして使い始めてください：

```bash
cp knowledge/_profile.template.md knowledge/profile.md
cp knowledge/_resume.template.md knowledge/resume.md
cp knowledge/_values.template.md knowledge/values.md
cp knowledge/_company.template.md knowledge/companies/会社名.md
```

または、Claude Codeに話しかけながら自動で蓄積させることもできます。
