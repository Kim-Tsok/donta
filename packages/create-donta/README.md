# create-donta

`npm create donta@latest my-app` is the create-style entry point after npm publication. The `donta` package also ships the same wizard as `donta create my-app` and `donta add .` (or `npx donta@latest create my-app`).

Generate a Next.js app with Drizzle, Better Auth and Postgres. Local development uses PGlite; set `DATABASE_URL` to use Neon.

From a checkout of the donta repository:

```sh
npm run create -- ../my-app --skip-install
cd ../my-app
npm install
npm run dev
```

For an existing app, run `create-donta --add .`. Preview with `--dry-run`; use `--yes` for unattended integration. See [the existing-project guide](docs/existing-projects.md).

CLI options: `--skip-install`, `--package-manager npm|pnpm|yarn|bun`, `--help`, `--version`. If no directory is supplied in an interactive terminal, the CLI prompts for one. Nonempty directories are rejected.

Generated projects include a private `.env.local` with a unique auth secret and a bundled runtime in `vendor/donta`. No published runtime package is needed.

## Development

Run `npm run build` before `npm test`. The builder snapshots `templates/next` and rebuilds `packages/donta` into `assets/`. Generated build output, local databases, dependencies and environment secrets are excluded.

`npm pack` rebuilds these assets automatically and creates an installable CLI tarball. Clack provides interactive prompts; application dependencies are installed in the generated project.
