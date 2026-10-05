import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/db.ts", "src/env.ts", "src/load-env.ts", "src/drizzle-config.ts"],
  format: "esm",
  platform: "node",
  dts: true,
});
