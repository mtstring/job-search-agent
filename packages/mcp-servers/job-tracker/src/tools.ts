import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  applicationToMarkdown,
  parseFrontmatter,
  stringifyFrontmatter,
  taskToLine,
} from "./parsers.ts";
import { DATA_DIR, ensureDataDir, readAllApplications } from "./storage.ts";
import type { Application, Task } from "./types.ts";

// --- ツール定義（ListToolsSchema 用） ---

export const toolDefinitions = [
  {
    name: "create_application",
    description: "応募企業を登録する",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string", description: "企業名" },
        position: { type: "string", description: "職種・ポジション" },
        agent_name: { type: "string", description: "担当エージェント名" },
        agent_email: { type: "string", description: "担当エージェントのメールアドレス" },
        notes: { type: "string", description: "メモ" },
      },
      required: ["company_name", "position"],
    },
  },
  {
    name: "update_application_status",
    description: "応募のステータスを更新する",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "応募ID" },
        status: {
          type: "string",
          enum: ["applied", "screening", "interview", "offer", "rejected", "accepted"],
          description: "新しいステータス",
        },
        notes: { type: "string", description: "メモ" },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "list_applications",
    description: "応募一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["applied", "screening", "interview", "offer", "rejected", "accepted"],
          description: "フィルターするステータス",
        },
      },
    },
  },
  {
    name: "create_task",
    description: "タスクを作成する",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "タスクタイトル" },
        application_id: { type: "string", description: "関連する応募ID" },
        description: { type: "string", description: "タスクの説明（メモとして追記）" },
        due_date: { type: "string", description: "期限 (YYYY-MM-DD)" },
        priority: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "優先度",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "complete_task",
    description: "タスクを完了にする",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "タスクID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_overdue_tasks",
    description: "期限超過・未完了タスクを取得する",
    inputSchema: { type: "object", properties: {} },
  },
];

// --- ツールハンドラー ---

export async function handleToolCall(name: string, args: unknown) {
  switch (name) {
    case "create_application": {
      const input = z
        .object({
          company_name: z.string(),
          position: z.string(),
          agent_name: z.string().optional(),
          agent_email: z.string().optional(),
          notes: z.string().optional(),
        })
        .parse(args);

      await ensureDataDir();
      const id = nanoid(10);
      const today = new Date().toISOString().split("T")[0];
      const slug = input.company_name.replace(/[^\w\u3040-\u9FFF]/g, "-").toLowerCase();
      const filePath = join(DATA_DIR, `${slug}-${id}.md`);

      const app: Application = {
        id,
        company_name: input.company_name,
        position: input.position,
        status: "applied",
        applied_at: today,
        updated_at: today,
        agent_name: input.agent_name,
        agent_email: input.agent_email,
        tasks: [],
      };

      let body = "\n## メモ\n\n";
      if (input.notes) body += `${input.notes}\n\n`;
      body += "## タスク\n";

      await writeFile(filePath, applicationToMarkdown(app, body));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                id,
                company_name: input.company_name,
                position: input.position,
                status: "applied",
                applied_at: today,
                file: filePath,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "update_application_status": {
      const input = z
        .object({
          id: z.string(),
          status: z.enum(["applied", "screening", "interview", "offer", "rejected", "accepted"]),
          notes: z.string().optional(),
        })
        .parse(args);

      const files = await readdir(DATA_DIR);
      const file = files.find((f) => f.endsWith(".md") && f.includes(input.id));
      if (!file) throw new Error(`応募ID ${input.id} が見つかりません`);

      const filePath = join(DATA_DIR, file);
      const content = await readFile(filePath, "utf-8");
      const { data, body } = parseFrontmatter(content);

      data.status = input.status;
      data.updated_at = new Date().toISOString().split("T")[0];

      let newBody = body;
      if (input.notes) {
        // メモセクションに追記
        const today = new Date().toISOString().split("T")[0];
        if (newBody.includes("## メモ")) {
          newBody = newBody.replace("## メモ\n", `## メモ\n\n${today}: ${input.notes}\n`);
        }
      }

      await writeFile(filePath, stringifyFrontmatter(data, newBody));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { id: input.id, status: input.status, updated_at: data.updated_at },
              null,
              2
            ),
          },
        ],
      };
    }

    case "list_applications": {
      const input = z
        .object({
          status: z
            .enum(["applied", "screening", "interview", "offer", "rejected", "accepted"])
            .optional(),
        })
        .parse(args ?? {});

      const apps = await readAllApplications();
      const filtered = input.status ? apps.filter((a) => a.status === input.status) : apps;
      const result = filtered.map(({ tasks: _, ...app }) => app);

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }

    case "create_task": {
      const input = z
        .object({
          title: z.string(),
          application_id: z.string().optional(),
          description: z.string().optional(),
          due_date: z.string().optional(),
          priority: z.enum(["high", "medium", "low"]).optional().default("medium"),
        })
        .parse(args);

      const taskId = nanoid(10);
      const newTask: Task = {
        id: taskId,
        title: input.title,
        completed: false,
        priority: input.priority,
        due_date: input.due_date,
      };

      if (input.application_id) {
        const appId = input.application_id;
        const files = await readdir(DATA_DIR);
        const file = files.find((f) => f.endsWith(".md") && f.includes(appId));
        if (!file) throw new Error(`応募ID ${appId} が見つかりません`);

        const filePath = join(DATA_DIR, file);
        const content = await readFile(filePath, "utf-8");
        const { data, body } = parseFrontmatter(content);

        let newBody = body;
        if (input.description) {
          const taskLine = `${taskToLine(newTask)}\n  - ${input.description}`;
          newBody = newBody.replace(/## タスク([\s\S]*)$/, `## タスク$1\n${taskLine}`);
        } else {
          newBody = newBody.replace(/## タスク([\s\S]*)$/, `## タスク$1\n${taskToLine(newTask)}`);
        }

        await writeFile(filePath, stringifyFrontmatter(data, newBody));
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                id: taskId,
                title: input.title,
                priority: input.priority,
                due_date: input.due_date,
                application_id: input.application_id,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "complete_task": {
      const input = z.object({ id: z.string() }).parse(args);

      const apps = await readAllApplications();
      let found = false;
      for (const app of apps) {
        const task = app.tasks.find((t) => t.id === input.id);
        if (!task) continue;

        const files = await readdir(DATA_DIR);
        const file = files.find((f) => f.endsWith(".md") && f.includes(app.id));
        if (!file) continue;

        const filePath = join(DATA_DIR, file);
        const content = await readFile(filePath, "utf-8");
        const today = new Date().toISOString().split("T")[0];

        // タスク行を更新: - [ ] → - [x] + completed タグ追記
        const taskIdPattern = new RegExp(`(- \\[)[ ](\\] .+\`id:${input.id}\`[^\n]*)`, "m");
        const updated = content
          .replace(taskIdPattern, `$1x$2 \`completed:${today}\``)
          .replace(/\n---\n/, `\nupdated_at: ${today}\n---\n`);

        await writeFile(filePath, updated);
        found = true;
        break;
      }

      if (!found) throw new Error(`タスクID ${input.id} が見つかりません`);

      return {
        content: [
          { type: "text", text: JSON.stringify({ id: input.id, completed: true }, null, 2) },
        ],
      };
    }

    case "get_overdue_tasks": {
      const today = new Date().toISOString().split("T")[0];
      const apps = await readAllApplications();
      const overdue: (Task & { company_name: string })[] = [];

      for (const app of apps) {
        for (const task of app.tasks) {
          if (!task.completed && task.due_date && task.due_date < today) {
            overdue.push({ ...task, company_name: app.company_name });
          }
        }
      }

      return {
        content: [{ type: "text", text: JSON.stringify(overdue, null, 2) }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
