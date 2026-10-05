import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { resolveDatabase, type Database } from "./env";

export type DontaDatabase<TSchema extends Record<string, unknown>> = PgDatabase<
  PgQueryResultHKT,
  TSchema
>;

export type CreateDbOptions<TSchema extends Record<string, unknown>> = {
  schema: TSchema;
  /** Override the database chosen from DATABASE_URL (mainly for tests). */
  database?: Database;
};

// PGlite allows one open instance per data directory. Keep them on globalThis
// so hot reloads in development reuse the instance instead of opening another.
const g = globalThis as { __dontaPglite?: Map<string, PGlite> };

function pglite(dir: string) {
  g.__dontaPglite ??= new Map();
  let client = g.__dontaPglite.get(dir);
  if (!client) {
    if (!dir.includes("://")) mkdirSync(dir, { recursive: true });
    client = new PGlite(dir);
    g.__dontaPglite.set(dir, client);
  }
  return client;
}

/**
 * Creates the project's Drizzle client: Neon over HTTP when DATABASE_URL is
 * set, local PGlite otherwise. It connects on first use rather than on import,
 * so builds that load the module in several workers never open PGlite.
 */
export function createDb<TSchema extends Record<string, unknown>>({
  schema,
  database = resolveDatabase(),
}: CreateDbOptions<TSchema>) {
  let instance: DontaDatabase<TSchema> | undefined;

  const connect = (): DontaDatabase<TSchema> =>
    database.kind === "neon"
      ? drizzleNeon({ client: neon(database.url), schema })
      : drizzlePglite({ client: pglite(database.dir), schema });

  const db = new Proxy({} as DontaDatabase<TSchema>, {
    get(_, prop) {
      instance ??= connect();
      const value = Reflect.get(instance, prop, instance);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });

  return { db, driver: database.kind };
}
