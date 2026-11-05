"use client";

import { useCallback, useState } from "react";
import { Elephant } from "./Elephant";
import { GlyphField } from "./GlyphField";
import { InstallCommand } from "./InstallCommand";
import { ScrambleText } from "./ScrambleText";
import { Terminal } from "./Terminal";
import { site } from "@/lib/site";

export function Hero() {
  const [awake, setAwake] = useState(false);
  const [mode, setMode] = useState<"create" | "add">("create");
  const wake = useCallback(() => setAwake(true), []);
  const existing = mode === "add";

  return (
    <section className="relative">
      <GlyphField className="pointer-events-none absolute inset-0 -top-24 h-[calc(100%+6rem)] w-full opacity-60 [mask-image:radial-gradient(ellipse_at_75%_35%,black_10%,transparent_65%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-8 sm:pt-14 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-12 lg:pb-24 lg:pt-20">
        <div className="min-w-0">
          <div className="flex items-end gap-4">
            <Elephant awake={awake} zzz className="h-20 w-auto shrink-0 sm:h-24" title={awake ? "donta elephant, awake" : "donta elephant, sleeping"} />
            <ScrambleText text="DONTA" onMount={false} onHover duration={600} className="cursor-default pb-0.5 font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl" />
          </div>
          <h1 className="mt-9 font-display text-[2.4rem] font-bold leading-[1.16] tracking-tight sm:text-5xl lg:text-[3rem]">Your app.<br />With Postgres<br />and auth.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-muted">{site.description}</p>
          <div className="mt-8 overflow-hidden rounded-lg border border-line bg-surface/80">
            <fieldset className="flex border-b border-line p-1.5">
              <legend className="sr-only">Choose your starting point</legend>
              {([['create', 'New project'], ['add', 'Existing app']] as const).map(([value, label]) => (
                <label key={value} className={`relative flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-lav ${mode === value ? 'bg-lav text-bg' : 'text-muted hover:text-ink'}`}>
                  <input className="sr-only" type="radio" name="setup-mode" value={value} checked={mode === value} onChange={() => setMode(value)} />{label}
                </label>
              ))}
            </fieldset>
            <div className="p-4">
              <InstallCommand command={existing ? site.commands.add : site.commands.create} />
              <p className="mt-3 min-h-12 text-xs leading-6 text-muted">{existing ? "Add the backend to your Next.js app. Preview file changes before applying them." : "Start with a database, working sign-in pages, and a protected dashboard."}</p>
              <a href={existing ? "/docs#existing-projects" : "/docs#quick-start"} className="mt-1 inline-flex min-h-11 items-center text-sm text-lav underline-offset-4 hover:underline">{existing ? "Read the integration guide" : "Follow the quick start"}<span className="ml-2" aria-hidden="true">↗</span></a>
            </div>
          </div>
          <p className="mt-4 text-xs leading-6 text-muted">Node.js 20.12+ · Next.js App Router · MIT licensed</p>
        </div>
        <div className="min-w-0">
          <Terminal key={mode} mode={mode} onDone={wake} />
          <p className="mt-4 text-center text-xs leading-6 text-muted">A preview of the real CLI. Your app stays yours.</p>
        </div>
      </div>
    </section>
  );
}
