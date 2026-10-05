import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { PGLITE_DIR, resolveDatabase } from "../src/env";
import { loadEnvFiles } from "../src/load-env";

describe("resolveDatabase", () => {
  it("uses Neon when DATABASE_URL is set", () => {
    const url = "postgresql://u:p@ep-x.eu-central-1.aws.neon.tech/neondb?sslmode=require";
    expect(resolveDatabase({ DATABASE_URL: url })).toEqual({ kind: "neon", url });
  });

  it("falls back to PGlite when DATABASE_URL is unset, empty or blank", () => {
    for (const env of [{}, { DATABASE_URL: "" }, { DATABASE_URL: "   " }]) {
      expect(resolveDatabase(env)).toEqual({ kind: "pglite", dir: PGLITE_DIR });
    }
  });
});

describe("loadEnvFiles", () => {
  const keys = ["DONTA_A", "DONTA_B", "DONTA_C", "DONTA_REAL"];
  afterEach(() => keys.forEach((k) => delete process.env[k]));

  function project(files: Record<string, string>) {
    const dir = mkdtempSync(join(tmpdir(), "donta-env-"));
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
    return dir;
  }

  it("lets earlier files win and never overrides the real environment", () => {
    process.env.DONTA_REAL = "from-shell";
    const dir = project({
      ".env.development.local": "DONTA_A=mode-local\n",
      ".env.local": "DONTA_A=local\nDONTA_B=local\n",
      ".env": "DONTA_A=base\nDONTA_B=base\nDONTA_C=base\nDONTA_REAL=file\n",
    });

    expect(loadEnvFiles(dir, "development")).toEqual([".env.development.local", ".env.local", ".env"]);
    expect(process.env.DONTA_A).toBe("mode-local");
    expect(process.env.DONTA_B).toBe("local");
    expect(process.env.DONTA_C).toBe("base");
    expect(process.env.DONTA_REAL).toBe("from-shell");
  });

  it("skips .env.local in test mode", () => {
    const dir = project({ ".env.local": "DONTA_A=local\n", ".env": "DONTA_A=base\n" });
    expect(loadEnvFiles(dir, "test")).toEqual([".env"]);
    expect(process.env.DONTA_A).toBe("base");
  });
});
