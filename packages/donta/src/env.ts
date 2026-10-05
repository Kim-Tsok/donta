/** Where local PGlite keeps its data when DATABASE_URL is unset. */
export const PGLITE_DIR = ".donta/pglite";

/** The Postgres a donta project talks to. */
export type Database =
  | { kind: "neon"; url: string }
  | { kind: "pglite"; dir: string };

/**
 * Decides which database to use. This is the only place the choice is made,
 * so the app (`donta/db`) and drizzle-kit (`donta/drizzle-config`) always agree:
 * Neon when DATABASE_URL is set, otherwise local PGlite.
 */
export function resolveDatabase(env: NodeJS.ProcessEnv = process.env): Database {
  const url = env.DATABASE_URL?.trim();
  return url ? { kind: "neon", url } : { kind: "pglite", dir: PGLITE_DIR };
}
