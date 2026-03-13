import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain"),
  industry: text("industry"),
  employee_count: integer("employee_count"),
  research_data: text("research_data"),
  last_researched_at: integer("last_researched_at"),
  created_at: integer("created_at").notNull(),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
