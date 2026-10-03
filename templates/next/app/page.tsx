import Link from "next/link";
import { PGLITE_DIR } from "donta/env";
import { Elephant } from "@/components/Elephant";
import { Panel, Rows } from "@/components/Panel";
import { driver } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="pt-12 sm:pt-20">
      <div className="flex items-end gap-4">
        <Elephant awake={!!session} zzz={!session} className="h-14 w-auto sm:h-16" />
        <span className="font-display text-4xl font-extrabold sm:text-5xl">DONTA</span>
      </div>
      <h1 className="mt-8 max-w-xl text-3xl font-light leading-tight sm:text-5xl">
        Your app is running.
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
        Next.js, Drizzle and Better Auth on Postgres. Edit <code className="text-ink">app/page.tsx</code> to
        start building.
      </p>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        {session ? (
          <Link href="/dashboard" className="rounded-md bg-lav px-4 py-2.5 font-medium text-bg hover:bg-lav-deep">
            Open dashboard
          </Link>
        ) : (
          <>
            <Link href="/sign-up" className="rounded-md bg-lav px-4 py-2.5 font-medium text-bg hover:bg-lav-deep">
              Create an account
            </Link>
            <Link href="/sign-in" className="rounded-md border border-line px-4 py-2.5 hover:border-lav/60 hover:text-lav">
              Sign in
            </Link>
          </>
        )}
      </div>

      <div className="mt-14 max-w-xl">
        <Panel title="status">
          <Rows
            rows={[
              ["database", driver === "neon" ? "Neon (DATABASE_URL)" : `PGlite (${PGLITE_DIR})`],
              ["orm", "Drizzle · lib/schema.ts"],
              ["auth", "Better Auth · email + password"],
              [
                "session",
                session ? (
                  <span className="text-mint">signed in as {session.user.email}</span>
                ) : (
                  "signed out"
                ),
              ],
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}
