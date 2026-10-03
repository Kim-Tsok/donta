import type { NextConfig } from "next";

const config: NextConfig = {
  // PGlite loads its own WASM and data files at runtime, so keep it out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default config;
