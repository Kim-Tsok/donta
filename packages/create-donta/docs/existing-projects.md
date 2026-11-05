# Add donta to an existing Next.js project

Automatic integration supports TypeScript Next.js App Router apps with `app/` or `src/app/`. It detects your package manager and does not require an `@/` import alias. Pages Router and JavaScript-only apps currently require manual integration.

From the donta repository:

```sh
npm run create -- --add /path/to/your-app
```

The wizard shows the exact files it will add and extend before asking to apply the plan. Cancel with Ctrl+C before applying to leave the project unchanged. Commit or stash your work first so you can review the resulting diff easily.

For scripts and CI:

```sh
npm run create -- --add /path/to/your-app --dry-run
npm run create -- --add /path/to/your-app --yes --skip-install
```

`--dry-run` does not write files, install packages or connect to a database. `--yes` accepts file changes. Installation runs unless `--skip-install` is set. Setup never applies migrations.

## What changes

- Adds database, auth, session helpers and a browser auth client in `lib/donta/` (or `src/lib/donta/`).
- Adds the `/api/auth/[...all]` route with a relative import and Node.js runtime.
- Adds `donta.config.ts` and the initial auth migrations in `drizzle-donta/`.
- Adds the database runtime to `vendor/donta/`. Commit this directory with your app.
- Adds required dependencies and `donta:generate`, `donta:migrate`, `donta:studio` scripts to `package.json`. Existing dependency versions and unrelated scripts are preserved.
- Adds missing auth environment settings to `.env.local`, keeping existing values. Secrets never appear in the preview.
- Extends `.gitignore` to exclude local database state and environment secrets.
- Adds `DONTA_SETUP.md` with instructions tailored to your project layout.

Your pages, layouts, styling, Next.js configuration and development script are preserved. Integration installs the backend; it does not add sign-in pages or dashboard UI.

## Finish setup

Install dependencies if you skipped installation. In your existing Next.js config, add PGlite to `serverExternalPackages`, keeping any existing entries:

```ts
const nextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
};
export default nextConfig;
```

This keeps PGlite's WASM and data files outside the server bundle. The wizard leaves your configuration untouched because it may use plugins or export a function.

The wizard offers a hidden Neon connection-string prompt, or you can configure the environment afterward. It validates the URL format without connecting. Connection strings never appear in the setup preview. Existing DATABASE_URL values are preserved.

Leave `DATABASE_URL` unset for embedded local Postgres. For Neon, put its connection string in `.env.local`. If your database already contains tables, review the auth schema and migration SQL before applying it. The default auth tables are `user`, `session`, `account`, and `verification`.

Stop the development server before migrating local PGlite:

```sh
npm run donta:migrate
npm run dev
```

## Add your sign-in UI

Import the generated client from your project's `lib/donta/auth-client` module:

```tsx
"use client";
import { useState } from "react";
import { authClient } from "@/lib/donta/auth-client";

export default function SignIn() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.email({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      if (result.error) setError(result.error.message ?? "Sign-in failed.");
      else window.location.assign("/");
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit}>
    <label>Email <input name="email" type="email" autoComplete="email" required /></label>
    <label>Password <input name="password" type="password" autoComplete="current-password" required /></label>
    {error && <p role="alert">{error}</p>}
    <button disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
  </form>;
}
```

The import above assumes your project defines `@/*`. Use a relative path if it does not. In a `src/` project the generated module lives in `src/lib/donta/`.

In server components, import `getSession` or `requireSession` from the generated session module. `getSession()` returns null when signed out. `requireSession()` redirects to `/sign-in`; create that page or change the redirect to match your login screen.

## Already using Drizzle or Better Auth?

The CLI stops when it detects an existing Drizzle configuration, Better Auth dependency or auth API directory. It avoids creating competing auth instances or migration histories. Use the template files as references to integrate manually:

1. Keep your existing Drizzle configuration and migration history. Add the required auth tables to your existing schema, reconciling table names, fields and references.
2. Use your current database client with Better Auth's `drizzleAdapter`. Pass your merged schema to the adapter.
3. Reuse your existing Better Auth instance and route handler if present. Add email/password support and `nextCookies()` only where needed.
4. Generate and inspect a migration through your existing Drizzle workflow. Do not apply donta's separate initial migration to a database whose auth tables already exist.
5. Add a browser auth client and session helpers that import your existing auth instance.

## Troubleshooting

**A file already exists:** No changes are made during planning. Review the conflicting file; merge manually rather than deleting working configuration. The CLI does not overwrite generated files on a second run.

**A file changed after preview:** Rerun setup to create a fresh plan. The CLI rechecks file contents before applying changes.

**Dependency installation failed:** Generated files remain available. Run your package manager's install command in the app and resolve the reported network or dependency issue.

**PGlite is locked:** Stop your dev server and other database tools before migrating or opening Studio. Only one process can own the local data directory.

**Production authentication fails:** Configure `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` on the host; local environment files are not deployed. Set the URL to the app's actual public origin. Use a private random secret (`openssl rand -base64 32`).

**Using another port locally:** Update `BETTER_AUTH_URL` in `.env.local` to match your app's origin.

**Production database:** Use Neon with `DATABASE_URL`, apply reviewed migrations as a release step, and deploy on the Node.js runtime. Email verification and password reset require your own email provider configuration.
