import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema/index";

export function createDb(url?: string) {
  const dbUrl = url ?? process.env.DATABASE_URL ?? "file:./job-search-agent.db";
  const client = createClient({ url: dbUrl });
  return drizzle(client, { schema });
}

export * from "./schema/index";
