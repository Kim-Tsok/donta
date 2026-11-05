import { CodeShowcase } from "@/components/CodeShowcase";
import { Elephant } from "@/components/Elephant";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { InstallCommand } from "@/components/InstallCommand";
import { Nav } from "@/components/Nav";
import { StackDiagram } from "@/components/StackDiagram";

function SectionHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-10 max-w-2xl">
      <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
      {children && <p className="mt-3 text-sm leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <div id="top">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-lav focus:px-3 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <section aria-label="What comes with donta" className="mx-auto grid max-w-6xl gap-8 px-4 pb-20 sm:px-8 md:grid-cols-3 lg:px-12">
          {[
            ["Postgres without the detour", "Start locally with PGlite. Add a Neon connection string when you need a hosted database."],
            ["Auth you can build on", "Email and password, sessions, and Drizzle tables. Wired up and ready for your app’s UI."],
            ["Your code, in your project", "Read the files. Change the schema. Keep your stack. The setup gets out of your way."],
          ].map(([title, description]) => <article key={title} className="border-t border-line pt-5"><h2 className="font-display text-base font-bold">{title}</h2><p className="mt-3 text-sm leading-7 text-muted">{description}</p></article>)}
        </section>

        <section className="border-t border-line bg-surface/30">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-8 md:grid-cols-2 lg:px-12 lg:py-20">
            <div>
              <p className="text-sm text-lav">Already building something?</p>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">Keep your app.<br />Add the backend.</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted">donta detects your App Router layout, previews its changes, and adds the database and auth files alongside your code.</p>
              <a href="/docs#existing-projects" className="mt-4 inline-flex min-h-11 items-center text-sm text-lav underline-offset-4 hover:underline">See exactly what gets added</a>
            </div>
            <div className="min-w-0 self-center">
              <InstallCommand command="npx donta-cli@latest add . --dry-run" />
              <ul className="mt-5 space-y-3 text-sm leading-7 text-muted">
                <li><span className="mr-3 text-mint" aria-hidden="true">+</span>Database, auth client, and session helpers</li>
                <li><span className="mr-3 text-mint" aria-hidden="true">+</span>Migration files and a guide for your project</li>
                <li><span className="mr-3 text-lav" aria-hidden="true">·</span>Your pages, layouts, and dev scripts stay in place</li>
              </ul>
              <p className="mt-5 border-t border-line pt-4 text-xs leading-6 text-muted">TypeScript · app/ or src/app/ · Existing auth and Drizzle setups require a manual merge. Connect your login UI after integration.</p>
            </div>
          </div>
        </section>

        <section id="stack" className="scroll-mt-8 border-t border-line bg-surface/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
            <SectionHead title="How it fits together">
              From your app to your database. Focus or hover a layer to see what’s connected.
            </SectionHead>
            <StackDiagram />
          </div>
        </section>

        <section id="code" className="scroll-mt-8 mx-auto max-w-6xl px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
          <SectionHead title="The generated code">
            Plain Drizzle and Better Auth files in your project. Change them like any other code.
          </SectionHead>
          <CodeShowcase />
        </section>

        <section className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-8 lg:px-12 lg:py-32">
            <Elephant awake className="h-20 w-auto sm:h-24" title="donta elephant, awake" />
            <h2 className="mt-8 font-display text-4xl font-bold tracking-tight sm:text-6xl">
              Your next project starts here.
            </h2>
            <p className="mt-4 max-w-md text-sm text-muted">
              Open the wizard. Choose your starting point. Get back to building.
            </p>
            <InstallCommand className="mt-8 w-full max-w-md" />
            <a href="/docs" className="mt-4 inline-flex min-h-11 items-center text-sm text-lav underline-offset-4 hover:underline">Read the documentation</a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
