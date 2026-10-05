# donta

Runtime glue for donta projects: Neon, Drizzle and Better Auth. Projects created with `create-donta` depend on it; you rarely import more than the lines below.

```ts
// lib/db.ts
import { createDb } from "donta/db";
import * as schema from "./schema";

export const { db, driver } = createDb({ schema });
```

```ts
// drizzle.config.ts
import { defineConfig } from "donta/drizzle-config";

export default defineConfig({ schema: "./lib/schema.ts", out: "./drizzle" });
```

## How it picks a database

| `DATABASE_URL` | Driver | Notes |
| --- | --- | --- |
| set | Neon over HTTP | One HTTP request per query, no connection to open on cold start |
| unset or empty | PGlite in `.donta/pglite` | Embedded Postgres, no account needed |

`createDb` and `defineConfig` make this choice in the same function (`resolveDatabase` in `donta/env`), so the app and drizzle-kit always use the same database.

## Entry points

| Import | Exports |
| --- | --- |
| `donta/db` | `createDb({ schema, database? })` → `{ db, driver }` |
| `donta/env` | `resolveDatabase(env?)`, `PGLITE_DIR` |
| `donta/load-env` | `loadEnvFiles(cwd?, mode?)`: loads `.env` files like Next.js and Vite, for tools that run outside them |
| `donta/drizzle-config` | `defineConfig({ schema, out? })` for drizzle-kit |

`createDb` connects on first query, not on import, so builds that load the module in many workers never open PGlite. PGlite instances are kept on `globalThis` so hot reloads reuse them.

## Develop

```sh
pnpm build      # tsdown → dist/
pnpm test       # vitest (PGlite in memory, no network)
pnpm typecheck
```
