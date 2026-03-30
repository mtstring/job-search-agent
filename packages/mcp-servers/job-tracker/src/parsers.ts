import type { Application, Frontmatter, Task } from "./types.ts";

// --- Frontmatter パーサー ---

export function parseFrontmatter(content: string): { data: Frontmatter; body: string } {
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

export function stringifyFrontmatter(data: Frontmatter, body: string): string {
  const yaml = Object.entries(data)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return `---\n${yaml}\n---\n${body}`;
}

// --- タスクパーサー ---
// 書式: - [ ] タイトル `id:xxx` `priority:high` `due:2026-01-20`
//       - [x] タイトル `id:xxx` `priority:medium` `completed:2026-01-10`

export function parseTasks(body: string, application_id?: string): Task[] {
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

export function taskToLine(task: Omit<Task, "application_id" | "completed">): string {
  let line = `- [ ] ${task.title} \`id:${task.id}\``;
  line += ` \`priority:${task.priority}\``;
  if (task.due_date) line += ` \`due:${task.due_date}\``;
  return line;
}

// --- Markdown 生成 ---

export function applicationToMarkdown(app: Application, existingBody?: string): string {
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
