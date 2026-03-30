import { describe, expect, test } from "bun:test";
import {
  parseFrontmatter,
  stringifyFrontmatter,
  parseTasks,
  taskToLine,
  applicationToMarkdown,
  type Application,
} from "./index.ts";

// --- parseFrontmatter ---

describe("parseFrontmatter", () => {
  test("基本的な frontmatter をパースできる", () => {
    const content = `---
id: test-001
company_name: テスト株式会社
status: applied
---
## メモ
テスト`;
    const { data, body } = parseFrontmatter(content);
    expect(data.id).toBe("test-001");
    expect(data.company_name).toBe("テスト株式会社");
    expect(data.status).toBe("applied");
    expect(body).toContain("## メモ");
  });

  test("frontmatter がない場合は空データとそのままの本文を返す", () => {
    const content = "ただのテキスト";
    const { data, body } = parseFrontmatter(content);
    expect(data).toEqual({});
    expect(body).toBe("ただのテキスト");
  });

  test("値にコロンを含むフィールドを正しくパースできる", () => {
    const content = `---
id: test-001
email_domain: example.co.jp, ats-system.com
---
body`;
    const { data } = parseFrontmatter(content);
    expect(data.email_domain).toBe("example.co.jp, ats-system.com");
  });

  test("空の frontmatter を扱える", () => {
    const content = `---

---
body`;
    const { data, body } = parseFrontmatter(content);
    expect(data).toEqual({});
    expect(body).toBe("body");
  });
});

// --- stringifyFrontmatter ---

describe("stringifyFrontmatter", () => {
  test("データと本文から Markdown を生成する", () => {
    const data = { id: "test-001", company_name: "テスト株式会社" };
    const body = "\n## メモ\nテスト";
    const result = stringifyFrontmatter(data, body);
    expect(result).toBe(`---
id: test-001
company_name: テスト株式会社
---
\n## メモ\nテスト`);
  });

  test("parseFrontmatter と往復できる（roundtrip）", () => {
    const original = { id: "abc", status: "interview", company_name: "LayerX" };
    const body = "\n## メモ\nテスト\n\n## タスク\n";
    const markdown = stringifyFrontmatter(original, body);
    const { data, body: parsedBody } = parseFrontmatter(markdown);
    expect(data).toEqual(original);
    expect(parsedBody).toBe(body);
  });
});

// --- parseTasks ---

describe("parseTasks", () => {
  test("未完了タスクをパースできる", () => {
    const body = `## タスク
- [ ] 面接準備 \`id:t001\` \`priority:high\` \`due:2026-03-25\``;
    const tasks = parseTasks(body);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe("t001");
    expect(tasks[0].title).toBe("面接準備");
    expect(tasks[0].completed).toBe(false);
    expect(tasks[0].priority).toBe("high");
    expect(tasks[0].due_date).toBe("2026-03-25");
  });

  test("完了タスクをパースできる", () => {
    const body = `## タスク
- [x] 書類提出 \`id:t002\` \`priority:medium\` \`completed:2026-03-20\``;
    const tasks = parseTasks(body);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].completed).toBe(true);
    expect(tasks[0].completed_at).toBe("2026-03-20");
  });

  test("複数タスクをパースできる", () => {
    const body = `## タスク
- [x] タスクA \`id:t001\` \`priority:high\` \`completed:2026-03-10\`
- [ ] タスクB \`id:t002\` \`priority:medium\` \`due:2026-03-25\`
- [ ] タスクC \`id:t003\` \`priority:low\` \`due:2026-04-01\``;
    const tasks = parseTasks(body);
    expect(tasks).toHaveLength(3);
    expect(tasks[0].completed).toBe(true);
    expect(tasks[1].completed).toBe(false);
    expect(tasks[2].priority).toBe("low");
  });

  test("タスクがない場合は空配列を返す", () => {
    const body = "## メモ\nメモだけ";
    const tasks = parseTasks(body);
    expect(tasks).toHaveLength(0);
  });

  test("application_id を引き継ぐ", () => {
    const body = `- [ ] テスト \`id:t001\` \`priority:medium\``;
    const tasks = parseTasks(body, "app-001");
    expect(tasks[0].application_id).toBe("app-001");
  });

  test("priority が省略された場合は medium になる", () => {
    const body = `- [ ] テスト \`id:t001\``;
    const tasks = parseTasks(body);
    expect(tasks[0].priority).toBe("medium");
  });
});

// --- taskToLine ---

describe("taskToLine", () => {
  test("基本的なタスク行を生成する", () => {
    const task = { id: "t001", title: "面接準備", priority: "high", due_date: "2026-03-25" };
    const line = taskToLine(task);
    expect(line).toBe("- [ ] 面接準備 `id:t001` `priority:high` `due:2026-03-25`");
  });

  test("due_date なしの場合は due タグを省略する", () => {
    const task = { id: "t001", title: "タスク", priority: "medium" };
    const line = taskToLine(task);
    expect(line).toBe("- [ ] タスク `id:t001` `priority:medium`");
    expect(line).not.toContain("due:");
  });

  test("parseTasks → taskToLine のラウンドトリップ", () => {
    const original = "- [ ] 面接準備 `id:t001` `priority:high` `due:2026-03-25`";
    const tasks = parseTasks(original);
    const line = taskToLine(tasks[0]);
    expect(line).toBe(original);
  });
});

// --- applicationToMarkdown ---

describe("applicationToMarkdown", () => {
  const baseApp: Application = {
    id: "test-001",
    company_name: "テスト株式会社",
    position: "エンジニア",
    status: "applied",
    applied_at: "2026-03-01",
    updated_at: "2026-03-01",
    tasks: [],
  };

  test("デフォルトのボディでマークダウンを生成する", () => {
    const md = applicationToMarkdown(baseApp);
    const { data, body } = parseFrontmatter(md);
    expect(data.id).toBe("test-001");
    expect(data.company_name).toBe("テスト株式会社");
    expect(body).toContain("## メモ");
    expect(body).toContain("## タスク");
  });

  test("タスクを含むマークダウンを生成する", () => {
    const app: Application = {
      ...baseApp,
      tasks: [
        { id: "t001", title: "面接準備", completed: false, priority: "high", due_date: "2026-04-01" },
        { id: "t002", title: "書類提出", completed: true, priority: "medium", completed_at: "2026-03-15" },
      ],
    };
    const md = applicationToMarkdown(app);
    expect(md).toContain("- [ ] 面接準備 `id:t001` `priority:high` `due:2026-04-01`");
    expect(md).toContain("- [x] 書類提出 `id:t002` `priority:medium` `completed:2026-03-15`");
  });

  test("既存のメモを保持しつつタスクセクションを更新する", () => {
    const existingBody = "\n## メモ\n\n重要なメモ\n\n## タスク\n- [ ] 古いタスク `id:old` `priority:low`";
    const app: Application = {
      ...baseApp,
      tasks: [{ id: "t001", title: "新しいタスク", completed: false, priority: "high" }],
    };
    const md = applicationToMarkdown(app, existingBody);
    expect(md).toContain("重要なメモ");
    expect(md).not.toContain("古いタスク");
    expect(md).toContain("新しいタスク");
  });

  test("agent_name / agent_email を含む場合は frontmatter に含まれる", () => {
    const app: Application = { ...baseApp, agent_name: "田中太郎", agent_email: "tanaka@agent.jp" };
    const md = applicationToMarkdown(app);
    const { data } = parseFrontmatter(md);
    expect(data.agent_name).toBe("田中太郎");
    expect(data.agent_email).toBe("tanaka@agent.jp");
  });
});
