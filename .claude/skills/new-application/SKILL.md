---
name: new-application
description: 新規応募企業の登録フロー。「○○社に応募した」「新しい会社の情報が来た」で発火
triggers:
  - 「○○社に応募した」
  - 「新しい会社から連絡が来た」
  - 新規企業のメール・情報を受け取った
---

# new-application

新規応募企業の登録は **4 つの成果物を必ず揃える**。1 つでも欠けると後のフローが壊れる。

## 成果物（すべて必須）

1. **`create_application` で MCP に登録** → id が返る
2. **`data/applications/{slug}-{id}.md`** 作成（frontmatter 付き）
3. **`knowledge/companies/{slug}/`** ディレクトリ作成
   - `company-profile.md`（企業プロフィール・志望動機）
   - `meeting-prep.md`（面接対策 — skills/meeting-prep-update 参照）
4. **`knowledge/status-overview.md`** に新規行追加（skills/status-overview-sync 参照）

## slug の決め方

- **英語のみ**。日本語 slug 禁止（rules/knowledge-layout.md 参照）
- 既存 `knowledge/companies/` を ls して重複回避
- 例: `example-corp`, `acme-tech`, `foo-bar-inc`

## data/applications/{slug}-{id}.md の frontmatter

```markdown
---
id: {create_application が返した id}
company_name: {会社名（日本語でOK）}
position: {職種}
status: applied
applied_at: {今日の日付 YYYY-MM-DD}
updated_at: {今日の日付 YYYY-MM-DD}
email_domain: {会社ドメイン, エージェントドメイン}
---
```

## 企業リサーチの委譲

企業情報が不足している場合は `agents/company-researcher.md` に委譲して `company-profile.md` を埋める。

## チェックリスト

- [ ] `create_application` を呼んで id を取得した
- [ ] `data/applications/{slug}-{id}.md` を作成した
- [ ] `knowledge/companies/{slug}/company-profile.md` を作成した
- [ ] `knowledge/companies/{slug}/meeting-prep.md` を作成した
- [ ] `knowledge/status-overview.md` に行を追加した
- [ ] slug は英語で、既存と重複していない
