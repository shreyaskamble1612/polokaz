import { drizzle } from "drizzle-orm/postgres-js";
import { existsSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { config as loadEnvFile } from "dotenv";

import * as schema from "./schema";

const envFiles = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", "..", ".env.local"),
  path.resolve(process.cwd(), "..", "..", ".env"),
  path.resolve(process.cwd(), "..", "..", "packages", "db", ".env"),
];

for (const envFile of envFiles) {
  if (existsSync(envFile)) {
    loadEnvFile({ path: envFile });
  }
}

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
