import Link from "next/link";
import { signOut } from "@/app/actions";
import { getSession } from "@/lib/session";
import { Elephant } from "./Elephant";
import { ThemeToggle } from "./ThemeToggle";

const link = "whitespace-nowrap text-ink/90 underline-offset-4 transition-colors hover:text-lav hover:underline";

export async function Nav() {
  const session = await getSession();

  return (
    <header className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-6 sm:gap-4 sm:px-8">
      <Link href="/" className="flex items-center" aria-label="Home">
        <Elephant animated={false} className="h-8 w-auto" title="donta" />
      </Link>
      <span className="h-7 w-px shrink-0 bg-ink/70" aria-hidden="true" />
      <nav aria-label="Main" className="flex gap-3 text-sm sm:gap-5">
        <Link href="/" className={link}>home</Link>
        <Link href="/dashboard" className={link}>dashboard</Link>
      </nav>
      <div className="ml-auto flex items-center gap-3 text-sm sm:gap-4">
        {session ? (
          <form action={signOut}>
            <button type="submit" className={link}>sign out</button>
          </form>
        ) : (
          <>
            <Link href="/sign-in" className={link}>sign in</Link>
            <Link href="/sign-up" className="hidden text-lav sm:inline">sign up</Link>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
