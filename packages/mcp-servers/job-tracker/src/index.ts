#!/usr/bin/env bun
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { nanoid } from "nanoid";
import { z } from "zod";

// data/applications/ はプロジェクトルートに置く
const DATA_DIR = join(import.meta.dir, "../../../../data/applications");

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

// --- Frontmatter パーサー ---

type Frontmatter = Record<string, string>;

function parseFrontmatter(content: string): { data: Frontmatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: content };

  const data: Frontmatter = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key) data[key] = value;
  }
  return { data, body: match[2] };
}

function stringifyFrontmatter(data: Frontmatter, body: string): string {
  const yaml = Object.entries(data)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return `---\n${yaml}\n---\n${body}`;
}

// --- タスクパーサー ---
// 書式: - [ ] タイトル `id:xxx` `priority:high` `due:2026-01-20`
//       - [x] タイトル `id:xxx` `priority:medium` `completed:2026-01-10`

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  due_date?: string;
  completed_at?: string;
  application_id?: string;
}

function parseTasks(body: string, application_id?: string): Task[] {
  const tasks: Task[] = [];
  const taskRegex = /^- \[([ x])\] (.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = taskRegex.exec(body)) !== null) {
    const completed = match[1] === "x";
    const rest = match[2];
    const idMatch = rest.match(/`id:([^`]+)`/);
    const priorityMatch = rest.match(/`priority:([^`]+)`/);
    const dueMatch = rest.match(/`due:([^`]+)`/);
    const completedMatch = rest.match(/`completed:([^`]+)`/);
    const title = rest.replace(/\s*`[^`]+`/g, "").trim();
    tasks.push({
      id: idMatch?.[1] ?? "",
      title,
      completed,
      priority: priorityMatch?.[1] ?? "medium",
      due_date: dueMatch?.[1],
      completed_at: completedMatch?.[1],
      application_id,
    });
  }
  return tasks;
}

function taskToLine(task: Omit<Task, "application_id" | "completed">): string {
  let line = `- [ ] ${task.title} \`id:${task.id}\``;
  line += ` \`priority:${task.priority}\``;
  if (task.due_date) line += ` \`due:${task.due_date}\``;
  return line;
}

// --- ファイル操作 ---

interface Application {
  id: string;
  company_name: string;
  position: string;
  status: string;
  applied_at: string;
  agent_name?: string;
  agent_email?: string;
  notes?: string;
  updated_at: string;
  tasks: Task[];
}

async function readApplication(filePath: string): Promise<Application> {
  const content = await readFile(filePath, "utf-8");
  const { data, body } = parseFrontmatter(content);
  const tasks = parseTasks(body, data.id);
  return {
    id: data.id ?? "",
    company_name: data.company_name ?? "",
    position: data.position ?? "",
    status: data.status ?? "applied",
    applied_at: data.applied_at ?? "",
    agent_name: data.agent_name || undefined,
    agent_email: data.agent_email || undefined,
    notes: data.notes || undefined,
    updated_at: data.updated_at ?? "",
    tasks,
  };
}

async function readAllApplications(): Promise<Application[]> {
  await ensureDataDir();
  const files = await readdir(DATA_DIR);
  const apps: Application[] = [];
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    apps.push(await readApplication(join(DATA_DIR, file)));
  }
  return apps;
}

function applicationToMarkdown(app: Application, existingBody?: string): string {
  const data: Frontmatter = {
    id: app.id,
    company_name: app.company_name,
    position: app.position,
    status: app.status,
    applied_at: app.applied_at,
    updated_at: app.updated_at,
  };
  if (app.agent_name) data.agent_name = app.agent_name;
  if (app.agent_email) data.agent_email = app.agent_email;

  // 既存のボディがあればタスクセクション以外を保持する
  let body = existingBody ?? "\n## メモ\n\n\n## タスク\n";

  // タスクセクションを再構築
  const taskSection = app.tasks
    .map((t) => {
      const check = t.completed ? "x" : " ";
      let line = `- [${check}] ${t.title} \`id:${t.id}\``;
      line += ` \`priority:${t.priority}\``;
      if (t.due_date) line += ` \`due:${t.due_date}\``;
      if (t.completed_at) line += ` \`completed:${t.completed_at}\``;
      return line;
    })
    .join("\n");

  // ## タスク セクションを置換
  if (body.includes("## タスク")) {
    body = body.replace(/## タスク[\s\S]*$/, `## タスク\n${taskSection}`);
  } else {
    body += `\n## タスク\n${taskSection}`;
  }

  return stringifyFrontmatter(data, body);
}

// --- MCP サーバー ---

const server = new Server(
  { name: "job-search-agent", version: "0.2.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
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
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
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
              text: JSON.stringify({ id, company_name: input.company_name, position: input.position, status: "applied", applied_at: today, file: filePath }, null, 2),
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
              text: JSON.stringify({ id: input.id, status: input.status, updated_at: data.updated_at }, null, 2),
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
          const files = await readdir(DATA_DIR);
          const file = files.find((f) => f.endsWith(".md") && f.includes(input.application_id!));
          if (!file) throw new Error(`応募ID ${input.application_id} が見つかりません`);

          const filePath = join(DATA_DIR, file);
          const content = await readFile(filePath, "utf-8");
          const { data, body } = parseFrontmatter(content);
          const existingTasks = parseTasks(body, input.application_id);

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
              text: JSON.stringify({ id: taskId, title: input.title, priority: input.priority, due_date: input.due_date, application_id: input.application_id }, null, 2),
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
          const taskIdPattern = new RegExp(
            `(- \\[)[ ](\\] .+\`id:${input.id}\`[^\n]*)`,
            "m"
          );
          const updated = content
            .replace(taskIdPattern, `$1x$2 \`completed:${today}\``)
            .replace(/\n---\n/, `\nupdated_at: ${today}\n---\n`);

          await writeFile(filePath, updated);
          found = true;
          break;
        }

        if (!found) throw new Error(`タスクID ${input.id} が見つかりません`);

        return {
          content: [{ type: "text", text: JSON.stringify({ id: input.id, completed: true }, null, 2) }],
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
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Job Tracker MCP server running on stdio");
}

main().catch(console.error);
