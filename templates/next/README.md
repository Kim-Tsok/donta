# donta · Next.js

Next.js with Drizzle and Better Auth on Postgres. Neon in production, PGlite on your machine.

This is the reference app for `create-donta`: everything the CLI generates for Next.js is checked against it.

## Run it

```sh
pnpm install
pnpm dev
```

No setup needed. With `DATABASE_URL` unset, the app uses PGlite, an embedded Postgres stored in `.donta/pglite`. `pnpm dev` applies any pending migrations before starting Next.js.

Open http://localhost:3000, create an account, and you land on `/dashboard`, which is protected.

## Use Neon

Copy `.env.example` to `.env.local` and set `DATABASE_URL` to your Neon connection string. Then:

```sh
pnpm db:migrate
pnpm dev
```

Production also needs `BETTER_AUTH_SECRET` (`openssl rand -base64 32`) and `BETTER_AUTH_URL`. Without the secret, Better Auth refuses to run when `NODE_ENV=production`.

## Where things are

| File | What it does |
| --- | --- |
| `lib/schema.ts` | Drizzle tables. Better Auth's tables come first; add yours below. |
| `lib/db.ts` | Drizzle client from `donta/db`: Neon HTTP when `DATABASE_URL` is set, PGlite otherwise. |
| `lib/auth.ts` | Better Auth config: Drizzle adapter, email and password. |
| `lib/session.ts` | `getSession()` and `requireSession()` for server components. |
| `app/actions.ts` | Server actions for sign-up, sign-in and sign-out. |
| `app/api/auth/[...all]/route.ts` | Better Auth's HTTP endpoints at `/api/auth/*`. |
| `app/dashboard/page.tsx` | The protected page, with an example Drizzle query. |
| `drizzle.config.ts` | drizzle-kit config from `donta/drizzle-config`. Picks the same database as `lib/db.ts`. |

## Change the schema

Edit `lib/schema.ts`, then:

```sh
pnpm db:generate   # writes a SQL migration to drizzle/
pnpm db:migrate    # applies it
```

Stop `pnpm dev` before running `db:migrate` against PGlite: only one process can open the data directory at a time. To start over locally, delete `.donta/`.

## Scripts

| Script | |
| --- | --- |
| `pnpm dev` | Apply migrations, then start Next.js |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm db:generate` | Generate a migration from `lib/schema.ts` |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm typecheck` | Run TypeScript |
