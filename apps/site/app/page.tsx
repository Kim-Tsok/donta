import { CodeShowcase } from "@/components/CodeShowcase";
import { Counters } from "@/components/Counters";
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
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-8 lg:px-12 lg:pb-28">
          <Counters />
        </section>

        <section id="stack" className="scroll-mt-8 border-t border-line bg-surface/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
            <SectionHead title="How it fits together">
              Hover a layer to see what donta configures in it.
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
              Skip the setup.
            </h2>
            <p className="mt-4 max-w-md text-sm text-muted">
              Get a database, ORM and auth configured with one command.
            </p>
            <InstallCommand className="mt-8" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
