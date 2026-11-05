export type DocSection = { id: string; title: string; paragraphs: string[]; code?: string };

// Shared by the documentation page and command-palette search.
export const DOCS: DocSection[] = [
  {
    id: "quick-start", title: "Start a project",
    paragraphs: [
      "donta wires together Next.js, Postgres, Drizzle and Better Auth. Account creation, sign-in and a protected dashboard come with every new project. Use Node.js 20.12 or newer.",
      "Both packages are available on npm. Run npx donta-cli@latest to open the wizard without a global install, or npm create donta@latest for the create-style entry point.",
      "The wizard asks where to create your app, how to connect Postgres and which package manager to use. Open localhost:3000 after starting development and create an account.",
    ],
    code: "npx donta-cli@latest create my-app\ncd my-app\nnpm run dev\n\n# Alternative entry point\nnpm create donta@latest my-app",
  },
  {
    id: "existing-projects", title: "Add to an existing app",
    paragraphs: [
      "Run the add command inside your TypeScript Next.js App Router project. Both app/ and src/app/ are supported. The wizard previews changes before applying them and detects your package manager.",
      "Integration adds database and auth modules in lib/donta, an auth API route, migration files, and DONTA_SETUP.md. Your existing pages, layouts and development scripts are preserved. It does not add sign-in UI.",
      "Follow DONTA_SETUP.md to add PGlite to serverExternalPackages in your Next.js config, apply migrations and connect your forms to the generated auth client. Existing auth routes, Better Auth or Drizzle configurations need a manual merge; setup stops with guidance rather than replacing them.",
    ],
    code: "npx donta-cli@latest add .\n\n# Review without writing files\ndonta add . --dry-run\n\n# Apply without prompts; install later\ndonta add . --yes --skip-install",
  },
  {
    id: "commands", title: "CLI reference",
    paragraphs: [
      "Run donta with no arguments for the interactive wizard. Use create for a new project and add for an existing one. The @latest version tag belongs to the package name, not the command.",
      "--skip-install writes files without installing dependencies. --package-manager accepts npm, pnpm, yarn or bun. For add, --dry-run previews changes and --yes accepts the plan without prompting. Setup never runs database migrations during integration.",
      "Cancel the wizard before applying the plan to leave your project unchanged. If installation fails, your generated files remain available; rerun your package manager’s install command in the project.",
    ],
    code: "donta\ndonta create my-app\ndonta add .\ndonta add . --dry-run\ndonta create my-app --package-manager pnpm\ndonta --help\ndonta --version",
  },
  {
    id: "database", title: "Connect Postgres",
    paragraphs: [
      "With DATABASE_URL unset, donta uses embedded PGlite in .donta/pglite. Local development needs no database account. Keep the data directory out of version control.",
      "To use Neon, select it in the wizard and paste a connection string into the hidden prompt, or set DATABASE_URL in .env.local afterward. Existing connection strings are preserved. Runtime queries and drizzle-kit use the same database choice.",
      "Setup validates the connection-string format without connecting. Review the auth tables and generated SQL before migrating an existing database, especially one that already contains user, session, account or verification tables.",
    ],
    code: '# .env.local — keep this file private\nDATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"',
  },
  {
    id: "authentication", title: "Use authentication",
    paragraphs: [
      "New projects include sign-up and sign-in pages, server actions and a protected dashboard. The generator creates a unique BETTER_AUTH_SECRET in the gitignored .env.local file.",
      "Existing-project integration generates lib/donta/auth-client.ts (under src/ when applicable). Call authClient.signUp.email or authClient.signIn.email from your forms, check the returned error, then redirect. Use authClient.signOut to end a session.",
      "Server components can use getSession() or requireSession() from the generated session module. requireSession redirects to /sign-in: create that page or change the redirect to match your login route. Email verification and password-reset delivery need your own email provider configuration.",
    ],
    code: '// Existing app: adjust this import to your project alias\nimport { authClient } from "@/lib/donta/auth-client";\n\nconst { error } = await authClient.signIn.email({ email, password });\nif (error) {\n  // Show the error in your form before redirecting.\n}',
  },
  {
    id: "migrations", title: "Change your schema",
    paragraphs: [
      "In a new project, edit lib/schema.ts. Generate a migration, review the SQL in drizzle/, then apply it. Development starts apply pending migrations before running Next.js.",
      "For an integrated project, edit lib/donta/schema.ts and use donta:generate and donta:migrate. These commands use donta.config.ts and drizzle-donta/. Your existing dev command is preserved, so run migrations explicitly.",
      "Stop the development server and database tools before migrating local PGlite. Only one process can open its data directory. Do not delete .donta/ unless you intend to discard the local database.",
    ],
    code: '# New project\nnpm run db:generate\nnpm run db:migrate\n\n# Existing-project integration\nnpm run donta:generate\nnpm run donta:migrate',
  },
  {
    id: "deployment", title: "Deploy your app",
    paragraphs: [
      "Use Neon for production and deploy your Next.js app on the Node.js runtime. Configure DATABASE_URL, BETTER_AUTH_SECRET and BETTER_AUTH_URL on your host; local environment files are not committed or deployed automatically.",
      "Set BETTER_AUTH_URL to your public origin and use a private random auth secret. Run reviewed migrations against the production database as a release step, then build and start your app. Commit vendor/donta with your project: it contains the standalone database runtime.",
    ],
    code: '# Generate a production auth secret\nopenssl rand -base64 32\n\n# After configuring your host environment\nnpm run db:migrate  # or donta:migrate for an integrated app\nnpm run build\nnpm start',
  },
  {
    id: "troubleshooting", title: "Troubleshooting",
    paragraphs: [
      "File conflicts: planning changes no files. Review and merge the conflicting configuration manually. A second integration run stops when it detects the existing setup.",
      "PGlite lock errors: stop your development server, Studio and other database processes before applying migrations. Start development again after migrating.",
      "Auth origin errors: make BETTER_AUTH_URL match your actual origin, including the port in development. Set a private BETTER_AUTH_SECRET on your production host.",
      "Command not found: install with npm install -g donta-cli to use the donta command directly, or run npx donta-cli@latest without a global install. See the full existing-project guide in the repository for merge examples and a working sign-in form.",
    ],
  },
];
