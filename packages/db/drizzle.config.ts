import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  schemaFilter: ["public"],
  migrations: {
    table: "drizzle_migrations",
  },
  dbCredentials: {
    // @ts-expect-error we cannot type nodejs on drizzle config
    url: process.env.DATABASE_URL,
  },
  out: "./migrations",
} satisfies Config;
