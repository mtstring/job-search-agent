import Anthropic from "@anthropic-ai/sdk";
import { createDb, applications, tasks } from "@job-search-agent/db";
import { eq, isNull, lt, and } from "drizzle-orm";
import { nanoid } from "nanoid";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `あなたは転職活動を全力でサポートするAIエージェントです。

ユーザーの転職活動の相談相手として、以下のことを行います：
- 応募企業の管理（登録・ステータス更新・一覧表示）
- タスク管理（面接準備・書類提出など）
- 転職活動全般のアドバイスと励まし
- 進捗の可視化と次のアクション提案

コミュニケーションスタイル：
- 親身で温かみのある口調を心がける
- ユーザーの不安や緊張を受け止め、前向きな気持ちをサポート
- 具体的で実践的なアドバイスを提供する
- 必要に応じてデータを取得・更新しながら、状況を把握して対話する

利用可能なツールを積極的に使って、ユーザーの転職活動を管理・サポートしてください。`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "list_applications",
    description: "応募企業一覧を取得する",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["applied", "screening", "interview", "offer", "rejected", "accepted"],
          description: "フィルターするステータス（省略時は全件）",
        },
      },
    },
  },
  {
    name: "create_application",
    description: "新しい応募企業を登録する",
    input_schema: {
      type: "object" as const,
      properties: {
        company_name: { type: "string", description: "企業名" },
        position: { type: "string", description: "職種・ポジション" },
        agent_name: { type: "string", description: "担当エージェント名" },
        notes: { type: "string", description: "メモ" },
      },
      required: ["company_name", "position"],
    },
  },
  {
    name: "update_application_status",
    description: "応募のステータスを更新する",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "応募ID" },
        status: {
          type: "string",
          enum: ["applied", "screening", "interview", "offer", "rejected", "accepted"],
          description: "新しいステータス",
        },
        notes: { type: "string", description: "更新時のメモ" },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "list_tasks",
    description: "タスク一覧を取得する",
    input_schema: {
      type: "object" as const,
      properties: {
        include_completed: {
          type: "boolean",
          description: "完了済みタスクも含めるか（デフォルト: false）",
        },
      },
    },
  },
  {
    name: "create_task",
    description: "新しいタスクを作成する",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "タスクタイトル" },
        application_id: { type: "string", description: "関連する応募ID" },
        due_date: { type: "string", description: "期限 (ISO8601形式)" },
        priority: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "優先度（デフォルト: medium）",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "complete_task",
    description: "タスクを完了にする",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "タスクID" },
      },
      required: ["id"],
    },
  },
];

type ToolInput = Record<string, unknown>;

async function executeTool(toolName: string, toolInput: ToolInput, dbUrl?: string): Promise<string> {
  const db = createDb(dbUrl);

  try {
    switch (toolName) {
      case "list_applications": {
        const status = toolInput.status as string | undefined;
        const result = status
          ? await db.select().from(applications).where(eq(applications.status, status as "applied" | "screening" | "interview" | "offer" | "rejected" | "accepted")).all()
          : await db.select().from(applications).all();
        return JSON.stringify(result, null, 2);
      }

      case "create_application": {
        const now = Date.now();
        const id = nanoid();
        await db.insert(applications).values({
          id,
          company_name: toolInput.company_name as string,
          position: toolInput.position as string,
          status: "applied",
          agent_name: toolInput.agent_name as string | undefined,
          notes: toolInput.notes as string | undefined,
          applied_at: now,
          created_at: now,
          updated_at: now,
        });
        const result = await db.select().from(applications).where(eq(applications.id, id)).get();
        return JSON.stringify(result, null, 2);
      }

      case "update_application_status": {
        const now = Date.now();
        await db
          .update(applications)
          .set({
            status: toolInput.status as "applied" | "screening" | "interview" | "offer" | "rejected" | "accepted",
            ...(toolInput.notes !== undefined ? { notes: toolInput.notes as string } : {}),
            updated_at: now,
          })
          .where(eq(applications.id, toolInput.id as string));
        const result = await db
          .select()
          .from(applications)
          .where(eq(applications.id, toolInput.id as string))
          .get();
        return JSON.stringify(result, null, 2);
      }

      case "list_tasks": {
        const includeCompleted = toolInput.include_completed as boolean | undefined;
        const result = includeCompleted
          ? await db.select().from(tasks).all()
          : await db.select().from(tasks).where(isNull(tasks.completed_at)).all();
        return JSON.stringify(result, null, 2);
      }

      case "create_task": {
        const now = Date.now();
        const id = nanoid();
        await db.insert(tasks).values({
          id,
          title: toolInput.title as string,
          application_id: toolInput.application_id as string | undefined,
          due_date: toolInput.due_date ? new Date(toolInput.due_date as string).getTime() : undefined,
          priority: (toolInput.priority as "high" | "medium" | "low") ?? "medium",
          created_at: now,
          updated_at: now,
        });
        const result = await db.select().from(tasks).where(eq(tasks.id, id)).get();
        return JSON.stringify(result, null, 2);
      }

      case "complete_task": {
        const now = Date.now();
        await db
          .update(tasks)
          .set({ completed_at: now, updated_at: now })
          .where(eq(tasks.id, toolInput.id as string));
        const result = await db
          .select()
          .from(tasks)
          .where(eq(tasks.id, toolInput.id as string))
          .get();
        return JSON.stringify(result, null, 2);
      }

      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function runChat(
  userMessage: string,
  history: Anthropic.MessageParam[] = [],
  dbUrl?: string
): Promise<{ response: string; history: Anthropic.MessageParam[] }> {
  const newHistory: Anthropic.MessageParam[] = [
    ...history,
    { role: "user", content: userMessage },
  ];

  let currentMessages = [...newHistory];

  // ツール実行ループ
  while (true) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: currentMessages,
    });

    // アシスタントのメッセージを履歴に追加
    currentMessages.push({ role: "assistant", content: response.content });

    // ツール使用がない場合はループ終了
    if (response.stop_reason !== "tool_use") {
      // テキスト応答を取得
      const textContent = response.content.find((c) => c.type === "text");
      const responseText = textContent ? textContent.text : "申し訳ありませんが、応答を生成できませんでした。";

      return {
        response: responseText,
        history: currentMessages,
      };
    }

    // ツール呼び出しを処理
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type === "tool_use") {
        const toolResult = await executeTool(block.name, block.input as ToolInput, dbUrl);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: toolResult,
        });
      }
    }

    // ツール結果をメッセージに追加
    currentMessages.push({ role: "user", content: toolResults });
  }
}
