"use client";

import { useEffect, useRef, useState } from "react";

// Only facts that are true of the project, no vanity metrics.
const STATS = [
  { value: "3", label: "libraries, pre-wired", note: "Neon · Drizzle · Better Auth" },
  { value: "1", label: "command to scaffold", note: "npm create donta" },
  { value: "4", label: "auth tables generated", note: "user · session · account · verification" },
  { value: "100", suffix: "%", label: "TypeScript", note: "schema to session, end to end" },
];

const LOOPS = 3;

function Digit({ d, on, delay }: { d: number; on: boolean; delay: number }) {
  // A strip of 0-9 repeated; roll through a few loops before landing.
  const target = on ? (LOOPS - 1) * 10 + d : 0;
  return (
    <span className="relative inline-block h-[1em] w-[0.6em] overflow-hidden align-top leading-none">
      <span
        className="odo-strip absolute left-0 top-0 flex flex-col"
        style={{ transform: `translateY(-${target}em)`, transitionDelay: `${delay}ms` }}
      >
        {Array.from({ length: LOOPS * 10 }, (_, i) => (
          <span key={i} className="block h-[1em]">
            {i % 10}
          </span>
        ))}
      </span>
    </span>
  );
}

export function Counters() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
      {STATS.map((s, i) => (
        <div key={s.label} className="group bg-bg p-6 transition-colors hover:bg-surface sm:p-8">
          <div className="font-display text-5xl font-bold text-lav sm:text-6xl" aria-hidden="true">
            {[...s.value].map((ch, j) => (
              <Digit key={j} d={Number(ch)} on={on} delay={i * 140 + j * 90} />
            ))}
            {s.suffix && <span className="text-3xl sm:text-4xl">{s.suffix}</span>}
          </div>
          <p className="mt-3 text-sm text-ink">
            <span className="sr-only">
              {s.value}
              {s.suffix}{" "}
            </span>
            {s.label}
          </p>
          <p className="mt-1 text-xs text-muted">{s.note}</p>
        </div>
      ))}
    </div>
  );
}
