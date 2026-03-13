import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
  company_name: text("company_name").notNull(),
  position: text("position").notNull(),
  status: text("status", {
    enum: ["applied", "screening", "interview", "offer", "rejected", "accepted"],
  })
    .notNull()
    .default("applied"),
  agent_name: text("agent_name"),
  agent_email: text("agent_email"),
  applied_at: integer("applied_at").notNull(),
  last_contact_at: integer("last_contact_at"),
  notes: text("notes"),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
