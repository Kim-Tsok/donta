import { defineConfig } from "donta/drizzle-config";

// Targets the same database as lib/db.ts. Reads .env files like Next.js does.
export default defineConfig({ schema: "./lib/schema.ts", out: "./drizzle" });
