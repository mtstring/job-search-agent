import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  session_id: text("session_id").notNull().unique(),
  user_id: text("user_id").notNull(),
  platform: text("platform", { enum: ["discord", "slack"] }).notNull(),
  channel_id: text("channel_id").notNull(),
  notes: text("notes"),
  created_at: integer("created_at").notNull(),
  last_message_at: integer("last_message_at").notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
