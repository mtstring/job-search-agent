import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { applications } from "./applications";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  application_id: text("application_id").references(() => applications.id),
  title: text("title").notNull(),
  description: text("description"),
  due_date: integer("due_date"),
  completed_at: integer("completed_at"),
  priority: text("priority", { enum: ["high", "medium", "low"] })
    .notNull()
    .default("medium"),
  reminded_at: integer("reminded_at"),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
