#!/usr/bin/env bun
import { createDb, applications, tasks } from "@job-search-agent/db";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { eq, and, isNull, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const db = createDb();

const server = new Server(
  {
    name: "job-search-agent",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
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
            description: { type: "string", description: "タスクの説明" },
            due_date: { type: "string", description: "期限 (ISO8601形式)" },
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
        description: "期限超過・滞留タスクを取得する",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

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

        const now = Date.now();
        const id = nanoid();
        await db.insert(applications).values({
          id,
          company_name: input.company_name,
          position: input.position,
          status: "applied",
          agent_name: input.agent_name,
          agent_email: input.agent_email,
          applied_at: now,
          notes: input.notes,
          created_at: now,
          updated_at: now,
        });

        const result = await db
          .select()
          .from(applications)
          .where(eq(applications.id, id))
          .get();

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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

        const now = Date.now();
        await db
          .update(applications)
          .set({
            status: input.status,
            ...(input.notes !== undefined ? { notes: input.notes } : {}),
            updated_at: now,
          })
          .where(eq(applications.id, input.id));

        const result = await db
          .select()
          .from(applications)
          .where(eq(applications.id, input.id))
          .get();

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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

        const result = input.status
          ? await db.select().from(applications).where(eq(applications.status, input.status)).all()
          : await db.select().from(applications).all();

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

        const now = Date.now();
        const id = nanoid();
        await db.insert(tasks).values({
          id,
          title: input.title,
          application_id: input.application_id,
          description: input.description,
          due_date: input.due_date ? new Date(input.due_date).getTime() : undefined,
          priority: input.priority,
          created_at: now,
          updated_at: now,
        });

        const result = await db.select().from(tasks).where(eq(tasks.id, id)).get();

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "complete_task": {
        const input = z.object({ id: z.string() }).parse(args);
        const now = Date.now();

        await db
          .update(tasks)
          .set({ completed_at: now, updated_at: now })
          .where(eq(tasks.id, input.id));

        const result = await db.select().from(tasks).where(eq(tasks.id, input.id)).get();

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_overdue_tasks": {
        const now = Date.now();
        const result = await db
          .select()
          .from(tasks)
          .where(and(lt(tasks.due_date, now), isNull(tasks.completed_at)))
          .all();

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
