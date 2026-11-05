# donta

A reusable Next.js starter with Drizzle, Better Auth, and Postgres. Develop locally with embedded PGlite; set `DATABASE_URL` to use Neon. Includes account creation, sign-in, a protected dashboard, and checked-in database migrations.

## Commands

The CLI supports:

```sh
donta                         # Interactive wizard
donta create my-app           # New project
donta add .                   # Existing Next.js app
donta add . --dry-run         # Preview integration
donta --help
```

Until the packages are published, run it from this checkout:

```sh
npm run donta -- create ../my-app
npm run donta -- add /path/to/existing-app
```

Once `donta` and `create-donta` are published to npm, you can run:

```sh
npx donta@latest create my-app
npx donta@latest add .
npm create donta@latest my-app
```

Or install globally with `npm install -g donta`, then use `donta create my-app`. The version tag belongs to the package (`donta@latest`), not the subcommand. These commands use the same wizard.

To use the short command locally before publishing, build and link the package:

```sh
npm run build --prefix packages/donta
npm link ./packages/donta
```

`npm link` registers the `donta` binary with your npm installation. Remove it later with `npm uninstall -g donta`. You can also use `npm pack` in `packages/donta` and install the resulting tarball; packing includes both the CLI assets and database runtime.

## Start your next project

Requires Node.js 20.12+ and npm. From this repository:

```sh
npm run create -- ../my-app --skip-install
cd ../my-app
npm install
npm run dev
```

Open http://localhost:3000 and create an account. The first development start applies database migrations automatically. No database account is needed.

Omit `--skip-install` to install dependencies during generation. Use `--package-manager pnpm` (or `yarn`, `bun`) to choose another manager. The generator accepts a new directory or an empty existing directory, and never overwrites an existing project. Each generated app gets its own secret in the gitignored `.env.local` file.

The generated app includes the built `donta` runtime in `vendor/donta`, referenced as a local package. Commit that directory with your project: no workspace link or unpublished npm package is required.

## Add to an existing Next.js app

```sh
npm run create -- --add /path/to/your-app
```

The interactive wizard previews file changes, detects your package manager, and adds database/auth modules while preserving your existing pages and scripts. Use `--dry-run` to inspect the plan or `--yes --skip-install` for unattended file generation.

Automatic integration supports TypeScript App Router projects, including `src/app`. It creates backend modules and a tailored `DONTA_SETUP.md`; follow that guide to add PGlite to your Next.js config, run migrations, and connect your login UI. Existing Drizzle or auth setups need a manual merge.

See the [existing-project guide](packages/create-donta/docs/existing-projects.md) for exact changes, examples, compatibility, and troubleshooting.

## Make it yours

Edit `lib/schema.ts`, then run `npm run db:generate` and `npm run db:migrate`. Stop the development server before migrating local PGlite, since only one process can open its data directory. Replace `app/dashboard/page.tsx` with your product's first protected screen.

The generated README describes the auth files, schema workflow, and available scripts.

## Deploy

Use a persistent hosted database for production. Set `DATABASE_URL` to a Neon connection string, `BETTER_AUTH_URL` to your public origin, and `BETTER_AUTH_SECRET` to a private random value (`openssl rand -base64 32`). Configure these on your host; `.env.local` is not committed. Run `npm run db:migrate` against that database as a release step, then `npm run build` and `npm start`. Deployments must use the Node.js runtime.

Email/password authentication is included. Password reset emails, email verification and social providers require configuring Better Auth for your application.

## Repository

- `packages/create-donta`: project generator and packaged template builder.
- `packages/donta`: database runtime and drizzle-kit configuration.
- `templates/next`: source template with working authentication.
- `apps/site`: marketing site.

```sh
npm run test:cli        # Build generator assets and test project creation
npm run test:runtime    # Run runtime tests, including real in-memory Postgres queries
```

To create a distributable CLI tarball, run `npm pack` in `packages/create-donta`. Packing rebuilds and includes the template and runtime. The CLI has not been published by this change; use the local command above or install the tarball.
