// Generated-code examples for the two supported setup paths.
export type Snippet = { file: string; lang: "ts" | "tsx"; code: string };
export type Framework = { id: string; name: string; files: Snippet[] };

export const FRAMEWORKS: Framework[] = [
  {
    "id": "next",
    "name": "New project",
    "files": [
      {
        "file": "lib/db.ts",
        "lang": "ts",
        "code": "import { createDb } from \"donta/db\";\nimport * as schema from \"./schema\";\n\n// Neon over HTTP when DATABASE_URL is set, local PGlite in .donta/pglite otherwise.\nexport const { db, driver } = createDb({ schema });"
      },
      {
        "file": "lib/auth.ts",
        "lang": "ts",
        "code": "import { betterAuth } from \"better-auth\";\nimport { drizzleAdapter } from \"better-auth/adapters/drizzle\";\nimport { nextCookies } from \"better-auth/next-js\";\nimport { db } from \"./db\";\nimport * as schema from \"./schema\";\n\nexport const auth = betterAuth({\n  database: drizzleAdapter(db, { provider: \"pg\", schema }),\n  emailAndPassword: { enabled: true },\n  // Lets server actions set the session cookie. Keep it last.\n  plugins: [nextCookies()],\n});"
      },
      {
        "file": "app/dashboard/page.tsx",
        "lang": "tsx",
        "code": "import { desc, eq } from \"drizzle-orm\";\nimport { signOut } from \"@/app/actions\";\nimport { Elephant } from \"@/components/Elephant\";\nimport { Panel, Rows } from \"@/components/Panel\";\nimport { db } from \"@/lib/db\";\nimport { session as sessionTable } from \"@/lib/schema\";\nimport { requireSession } from \"@/lib/session\";\n\nconst date = (d: Date) => d.toISOString().slice(0, 16).replace(\"T\", \" \") + \" UTC\";\n\nexport default async function Dashboard() {\n  const { user, session } = await requireSession();\n\n  // A plain Drizzle query against the auth tables.\n  const sessions = await db\n    .select()\n    .from(sessionTable)\n    .where(eq(sessionTable.userId, user.id))\n    .orderBy(desc(sessionTable.createdAt));\n\n  return (\n    <div className=\"pt-12 sm:pt-20\">\n      <Elephant awake className=\"h-14 w-auto\" />\n      <h1 className=\"mt-6 font-display text-3xl font-bold sm:text-4xl\">Hi, {user.name}</h1>\n      <p className=\"mt-3 text-sm text-muted\">\n        This page is protected. Signed-out visitors are sent to /sign-in.\n      </p>\n\n      <div className=\"mt-10 grid gap-6 lg:grid-cols-2\">\n        <Panel title=\"user\">\n          <Rows\n            rows={[\n              [\"name\", user.name],\n              [\"email\", user.email],\n              [\"id\", user.id],\n              [\"joined\", date(user.createdAt)],\n            ]}\n          />\n        </Panel>\n\n        <Panel title={`sessions (${sessions.length})`}>\n          <ul className=\"flex flex-col gap-3\">\n            {sessions.map((s) => (\n              <li key={s.id} className=\"flex flex-col gap-0.5\">\n                <span className=\"truncate text-ink\">{s.userAgent || \"unknown device\"}</span>\n                <span className=\"text-xs text-muted\">\n                  {date(s.createdAt)}\n                  {s.id === session.id && <span className=\"ml-2 text-mint\">current</span>}\n                </span>\n              </li>\n            ))}\n          </ul>\n        </Panel>\n      </div>\n\n      <form action={signOut} className=\"mt-10\">\n        <button\n          type=\"submit\"\n          className=\"rounded-md border border-line px-4 py-2.5 text-sm hover:border-lav/60 hover:text-lav\"\n        >\n          Sign out\n        </button>\n      </form>\n    </div>\n  );\n}"
      }
    ]
  },
  {
    "id": "existing",
    "name": "Existing app",
    "files": [
      {
        "file": "lib/donta/db.ts",
        "lang": "ts",
        "code": "import { createDb } from \"donta/db\";\nimport * as schema from \"./schema\";\n\n// Neon over HTTP when DATABASE_URL is set, local PGlite in .donta/pglite otherwise.\nexport const { db, driver } = createDb({ schema });"
      },
      {
        "file": "lib/donta/auth-client.ts",
        "lang": "ts",
        "code": "\"use client\";\n\nimport { createAuthClient } from \"better-auth/react\";\n\nexport const authClient = createAuthClient();"
      },
      {
        "file": "donta.config.ts",
        "lang": "ts",
        "code": "import { defineConfig } from \"donta/drizzle-config\";\n\nexport default defineConfig({\n  schema: \"./lib/donta/schema.ts\",\n  out: \"./drizzle-donta\",\n});"
      }
    ]
  }
];
