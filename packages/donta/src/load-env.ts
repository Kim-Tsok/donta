import { existsSync } from "node:fs";
import { join } from "node:path";

// Kept out of donta/env on purpose: the app imports donta/env, and bundlers
// trace dynamic file paths like these into the server output.

/**
 * Loads .env files the way Next.js and Vite do, for tools that run outside
 * them (drizzle-kit, scripts). Earlier files win, and variables already set
 * in the environment are never overridden.
 */
export function loadEnvFiles(
  cwd: string = process.cwd(),
  mode: string = process.env.NODE_ENV || "development",
) {
  const files = [`.env.${mode}.local`, ".env.local", `.env.${mode}`, ".env"];
  // Next.js skips .env.local in tests so results are reproducible.
  if (mode === "test") files.splice(1, 1);

  const loaded: string[] = [];
  for (const file of files) {
    const path = join(cwd, file);
    if (!existsSync(path)) continue;
    process.loadEnvFile(path);
    loaded.push(file);
  }
  return loaded;
}
