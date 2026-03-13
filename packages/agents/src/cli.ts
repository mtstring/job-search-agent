#!/usr/bin/env bun
/**
 * CLI entry point for OpenClaw Skills
 * Usage:
 *   bun cli.ts chat "メッセージ" [--session SESSION_ID]
 *   bun cli.ts status [--filter STATUS]
 *   bun cli.ts add-application --company "会社名" --position "職種" [--agent "エージェント名"] [--notes "メモ"]
 *   bun cli.ts overdue-tasks
 */
import { runChat } from "./orchestrator.js";
import { createDb, applications, tasks, conversations } from "@job-search-agent/db";
import { eq, isNull, lt, and } from "drizzle-orm";
import { nanoid } from "nanoid";

const args = process.argv.slice(2);
const command = args[0];

const db = createDb(process.env.DATABASE_URL);

// ステータスアイコン
const STATUS_ICONS: Record<string, string> = {
  applied: "📩",
  screening: "🔍",
  interview: "🗣️",
  offer: "🎉",
  rejected: "❌",
  accepted: "✅",
};

async function main() {
  switch (command) {
    case "chat": {
      // --session オプション解析
      const sessionIdx = args.indexOf("--session");
      const sessionId = sessionIdx >= 0 ? args[sessionIdx + 1] : undefined;
      const messageArgs = args.slice(1).filter((a, i, arr) => a !== "--session" && arr[i - 1] !== "--session");
      const message = messageArgs.join(" ");

      if (!message) {
        console.error("メッセージを指定してください");
        process.exit(1);
      }

      // セッション履歴をDBから取得
      let history: any[] = [];
      let actualSessionId = sessionId;

      if (sessionId) {
        const rows = await db.select().from(conversations).where(eq(conversations.session_id, sessionId)).limit(1);
        const conv = rows[0];
        if (conv?.notes) {
          try { history = JSON.parse(conv.notes); } catch {}
        }
      } else {
        actualSessionId = nanoid();
      }

      const result = await runChat(message, history, process.env.DATABASE_URL);

      // セッション保存・更新
      const existingRows = actualSessionId
        ? await db.select().from(conversations).where(eq(conversations.session_id, actualSessionId)).limit(1)
        : [];
      const existing = existingRows[0];
      const now = Date.now();
      if (existing) {
        await db.update(conversations).set({
          notes: JSON.stringify(result.history),
          last_message_at: now,
        }).where(eq(conversations.session_id, actualSessionId!));
      } else {
        await db.insert(conversations).values({
          id: nanoid(),
          session_id: actualSessionId!,
          user_id: "openclaw",
          platform: "discord",
          channel_id: "openclaw",
          created_at: now,
          last_message_at: now,
          notes: JSON.stringify(result.history),
        });
      }

      // セッションIDを先頭行に出力（スキルが次回引き継ぐため）
      console.log(`SESSION:${actualSessionId}`);
      console.log(result.response);
      break;
    }

    case "status": {
      const filterIdx = args.indexOf("--filter");
      const filter = filterIdx >= 0 ? args[filterIdx + 1] : undefined;

      let rows;
      if (filter) {
        rows = await db.select().from(applications).where(eq(applications.status, filter as any));
      } else {
        rows = await db.select().from(applications);
      }

      if (rows.length === 0) {
        console.log("応募企業はまだ登録されていません。");
        break;
      }

      // ステータスごとにグループ化
      const grouped: Record<string, typeof rows> = {};
      for (const row of rows) {
        if (!grouped[row.status]) grouped[row.status] = [];
        grouped[row.status].push(row);
      }

      const lines: string[] = ["## 応募状況一覧\n"];
      for (const [status, items] of Object.entries(grouped)) {
        const icon = STATUS_ICONS[status] ?? "📋";
        lines.push(`**${icon} ${status.toUpperCase()}** (${items.length}件)`);
        for (const item of items) {
          const date = item.applied_at ? new Date(item.applied_at).toLocaleDateString("ja-JP") : "日付不明";
          lines.push(`  - ${item.company_name}（${item.position}）/ ${date}`);
        }
        lines.push("");
      }
      console.log(lines.join("\n"));
      break;
    }

    case "add-application": {
      const get = (flag: string) => {
        const i = args.indexOf(flag);
        return i >= 0 ? args[i + 1] : undefined;
      };
      const company = get("--company");
      const position = get("--position");
      const agentName = get("--agent");
      const notes = get("--notes");

      if (!company || !position) {
        console.error("--company と --position は必須です");
        process.exit(1);
      }

      const id = nanoid();
      await db.insert(applications).values({
        id,
        company_name: company,
        position,
        status: "applied",
        agent_name: agentName ?? null,
        notes: notes ?? null,
        applied_at: Date.now(),
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      console.log(`✅ 登録しました: ${company}（${position}）`);
      break;
    }

    case "overdue-tasks": {
      const now = Date.now();
      const rows = await db.select().from(tasks).where(
        and(isNull(tasks.completed_at), lt(tasks.due_date, now))
      );

      if (rows.length === 0) {
        console.log("期限切れのタスクはありません。");
        break;
      }

      const lines = ["## ⚠️ 期限切れタスク\n"];
      for (const task of rows) {
        const due = task.due_date ? new Date(task.due_date).toLocaleDateString("ja-JP") : "期限不明";
        const priority = task.priority === "high" ? "🔴" : task.priority === "medium" ? "🟡" : "🟢";
        lines.push(`${priority} **${task.title}** (期限: ${due})`);
        if (task.description) lines.push(`  ${task.description}`);
      }
      console.log(lines.join("\n"));
      break;
    }

    default:
      console.error(`不明なコマンド: ${command}`);
      console.error("使用可能: chat, status, add-application, overdue-tasks");
      process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
