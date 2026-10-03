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
  const wake = useCallback(() => setAwake(true), []);

  return (
    <section className="relative">
      <GlyphField className="pointer-events-none absolute inset-0 -top-24 h-[calc(100%+6rem)] w-full [mask-image:radial-gradient(ellipse_at_70%_40%,black_20%,transparent_75%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:px-12 lg:pb-28 lg:pt-24">
        <div>
          <h1 className="flex items-end gap-4">
            <Elephant
              awake={awake}
              zzz
              className="h-24 w-auto shrink-0 sm:h-32"
              title={
                awake ? "donta elephant, awake" : "donta elephant, sleeping"
              }
            />
            <ScrambleText
              text="DONTA"
              onMount={false}
              onHover
              duration={600}
              className="cursor-default pb-0.5 font-display text-5xl font-bold leading-none tracking-tight sm:text-6xl"
            />
          </h1>
          <p className="mt-8 text-4xl font-light leading-[1.2] tracking-tight text-ink sm:text-5xl lg:text-[3.1rem]">
            <ScrambleText text="The full-stack" delay={200} />
            <br />
            <ScrambleText text="Postgres starter." delay={450} />
          </p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            {site.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <InstallCommand />
          </div>
        </div>
        <Terminal onDone={wake} />
      </div>
    </section>
  );
}
