// What `create-donta` generates. Keep in sync with templates/ once they exist.

export type Snippet = { file: string; lang: "ts" | "tsx"; code: string };
export type Framework = { id: string; name: string; files: Snippet[] };

export const FRAMEWORKS: Framework[] = [
  {
    id: "next",
    name: "Next.js",
    files: [
      {
        file: "lib/db.ts",
        lang: "ts",
        code: `import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle({ client: sql, schema });`,
      },
      {
        file: "lib/auth.ts",
        lang: "ts",
        code: `import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  plugins: [nextCookies()],
});`,
      },
      {
        file: "app/dashboard/page.tsx",
        lang: "tsx",
        code: `import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/sign-in");

  return <h1>Hi, {session.user.name}</h1>;
}`,
      },
    ],
  },
  {
    id: "hono",
    name: "React + Hono",
    files: [
      {
        file: "server/db.ts",
        lang: "ts",
        code: `import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle({ client: sql, schema });`,
      },
      {
        file: "server/index.ts",
        lang: "ts",
        code: `import { Hono } from "hono";
import { auth } from "./auth";

const app = new Hono();

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/api/me", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "unauthorized" }, 401);
  return c.json(session.user);
});

export default app;`,
      },
      {
        file: "src/components/Profile.tsx",
        lang: "tsx",
        code: `import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient();

export function Profile() {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return <p>Loading…</p>;
  if (!session) return <a href="/sign-in">Sign in</a>;

  return <p>Hi, {session.user.name}</p>;
}`,
      },
    ],
  },
];
