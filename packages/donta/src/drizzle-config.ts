import { mkdirSync } from "node:fs";
import type { Config } from "drizzle-kit";
import { resolveDatabase } from "./env";
import { loadEnvFiles } from "./load-env";

export type DontaConfigOptions = {
  /** Path to the Drizzle schema, e.g. "./lib/schema.ts". */
  schema: string;
  /** Where migrations are written. Defaults to "./drizzle". */
  out?: string;
};

/**
 * drizzle-kit config that targets the same database as `createDb`: Neon when
 * DATABASE_URL is set (from the environment or .env files), PGlite otherwise.
 */
export function defineConfig({ schema, out = "./drizzle" }: DontaConfigOptions): Config {
  loadEnvFiles();
  const database = resolveDatabase();

  if (database.kind === "neon") {
    return { dialect: "postgresql", schema, out, dbCredentials: { url: database.url } };
  }

  // PGlite creates its data directory but not the parents.
  mkdirSync(database.dir, { recursive: true });
  return { dialect: "postgresql", driver: "pglite", schema, out, dbCredentials: { url: database.dir } };
}
