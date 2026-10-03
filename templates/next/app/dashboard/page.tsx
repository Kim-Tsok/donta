import { desc, eq } from "drizzle-orm";
import { signOut } from "@/app/actions";
import { Elephant } from "@/components/Elephant";
import { Panel, Rows } from "@/components/Panel";
import { db } from "@/lib/db";
import { session as sessionTable } from "@/lib/schema";
import { requireSession } from "@/lib/session";

const date = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ") + " UTC";

export default async function Dashboard() {
  const { user, session } = await requireSession();

  // A plain Drizzle query against the auth tables.
  const sessions = await db
    .select()
    .from(sessionTable)
    .where(eq(sessionTable.userId, user.id))
    .orderBy(desc(sessionTable.createdAt));

  return (
    <div className="pt-12 sm:pt-20">
      <Elephant awake className="h-14 w-auto" />
      <h1 className="mt-6 font-display text-3xl font-bold sm:text-4xl">Hi, {user.name}</h1>
      <p className="mt-3 text-sm text-muted">
        This page is protected. Signed-out visitors are sent to /sign-in.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Panel title="user">
          <Rows
            rows={[
              ["name", user.name],
              ["email", user.email],
              ["id", user.id],
              ["joined", date(user.createdAt)],
            ]}
          />
        </Panel>

        <Panel title={`sessions (${sessions.length})`}>
          <ul className="flex flex-col gap-3">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-col gap-0.5">
                <span className="truncate text-ink">{s.userAgent || "unknown device"}</span>
                <span className="text-xs text-muted">
                  {date(s.createdAt)}
                  {s.id === session.id && <span className="ml-2 text-mint">current</span>}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <form action={signOut} className="mt-10">
        <button
          type="submit"
          className="rounded-md border border-line px-4 py-2.5 text-sm hover:border-lav/60 hover:text-lav"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
