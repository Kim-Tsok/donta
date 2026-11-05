import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { DOCS } from "@/lib/docs";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Documentation · donta",
  description: "Create a Next.js app or add Postgres and authentication to an existing project with donta.",
};

export default function Docs() {
  return (
    <div id="top">
      <a href="#docs-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-bg focus:p-3">Skip to documentation</a>
      <Nav />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-8 lg:px-12">
        <header className="border-b border-line pb-10">
          <p className="text-sm text-lav">Documentation</p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">From setup to your first session.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted">A fresh project or an app you already have. Connect Postgres, add authentication, and keep building.</p>
        </header>
        <div className="mt-10 grid min-w-0 gap-12 md:grid-cols-[12rem_minmax(0,1fr)]">
          <aside>
            <nav aria-label="Documentation sections" className="flex flex-wrap gap-x-5 gap-y-1 md:sticky md:top-8 md:flex-col">
              {DOCS.map(section => <a key={section.id} href={`#${section.id}`} className="flex min-h-11 items-center text-sm text-muted underline-offset-4 hover:text-lav hover:underline">{section.title}</a>)}
              <a href={`${site.links.github}/blob/main/packages/create-donta/docs/existing-projects.md`} className="mt-3 flex min-h-11 items-center text-sm text-lav underline-offset-4 hover:underline">Full integration guide</a>
            </nav>
          </aside>
          <main id="docs-content" className="min-w-0 max-w-3xl">
            {DOCS.map(section => (
              <section key={section.id} id={section.id} className="mb-14 scroll-mt-8 border-b border-line pb-14 last:mb-0 last:border-0">
                <h2 className="font-display text-2xl font-bold sm:text-3xl"><a href={`#${section.id}`} className="underline-offset-4 hover:underline">{section.title}</a></h2>
                {section.paragraphs.map(paragraph => <p key={paragraph} className="mt-5 text-base leading-8 text-muted">{paragraph}</p>)}
                {section.code && <pre aria-label={`${section.title} example`} tabIndex={0} className="mt-6 overflow-x-auto rounded-lg border border-line bg-surface p-5 text-sm leading-7 text-ink"><code>{section.code}</code></pre>}
              </section>
            ))}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
