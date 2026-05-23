import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config";

import * as schema from "./schema";

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// Normalize common misconfigurations from copied env values.
databaseUrl = databaseUrl.trim();
while (
  databaseUrl.startsWith('"') ||
  databaseUrl.endsWith('"') ||
  databaseUrl.startsWith("'") ||
  databaseUrl.endsWith("'")
) {
  databaseUrl = databaseUrl.replace(/^['"]+|['"]+$/g, "").trim();
}

const client = postgres(databaseUrl);

export const db = drizzle(client, { schema });
