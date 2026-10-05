import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defineConfig } from "../src/drizzle-config";

describe("defineConfig", () => {
  const cwd = process.cwd();
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "donta-config-"));
    process.chdir(dir);
    delete process.env.DATABASE_URL;
  });
  afterEach(() => {
    process.chdir(cwd);
    rmSync(dir, { recursive: true, force: true });
    delete process.env.DATABASE_URL;
  });

  it("targets PGlite and creates its directory when DATABASE_URL is unset", () => {
    expect(defineConfig({ schema: "./lib/schema.ts" })).toEqual({
      dialect: "postgresql",
      driver: "pglite",
      schema: "./lib/schema.ts",
      out: "./drizzle",
      dbCredentials: { url: ".donta/pglite" },
    });
    expect(existsSync(join(dir, ".donta/pglite"))).toBe(true);
  });

  it("targets Neon when DATABASE_URL is set", () => {
    process.env.DATABASE_URL = "postgresql://u:p@ep-x.neon.tech/db";
    expect(defineConfig({ schema: "./lib/schema.ts", out: "./migrations" })).toEqual({
      dialect: "postgresql",
      schema: "./lib/schema.ts",
      out: "./migrations",
      dbCredentials: { url: "postgresql://u:p@ep-x.neon.tech/db" },
    });
  });
});
