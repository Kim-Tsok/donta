import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

/** The current session, or null. Deduplicated within a request. */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

/** The current session. Redirects to /sign-in when signed out. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}
