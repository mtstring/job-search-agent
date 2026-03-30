import { existsSync } from "node:fs";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Application } from "./types.ts";
import { parseFrontmatter, parseTasks } from "./parsers.ts";

// data/applications/ はプロジェクトルートに置く
export const DATA_DIR = join(import.meta.dir, "../../../../data/applications");

export async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

export async function readApplication(filePath: string): Promise<Application> {
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

export async function readAllApplications(): Promise<Application[]> {
  await ensureDataDir();
  const files = await readdir(DATA_DIR);
  const apps: Application[] = [];
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    apps.push(await readApplication(join(DATA_DIR, file)));
  }
  return apps;
}
