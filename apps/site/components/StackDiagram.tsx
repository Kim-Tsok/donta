import { Fragment, type CSSProperties } from "react";
import { NODES } from "@/lib/stack";

// Glyph packets travelling between nodes. Requests flow right, results flow back.
const PACKETS = [
  [
    { g: "GET", back: false, delay: "0s" },
    { g: "{user}", back: true, delay: "1.6s" },
  ],
  [
    { g: "auth?", back: false, delay: "0.5s" },
    { g: "✓", back: true, delay: "2.1s" },
  ],
  [
    { g: "$1", back: false, delay: "0.9s" },
    { g: "1 row", back: true, delay: "2.5s" },
  ],
];

export function StackDiagram() {
  return (
    <div className="flex flex-col items-stretch md:flex-row md:items-start">
      {NODES.map((n, i) => (
        <Fragment key={n.name}>
          <div
            tabIndex={0}
            className="group relative rounded-lg border border-line bg-surface p-5 transition-colors hover:border-lav/70 focus-visible:border-lav/70 md:w-40 md:shrink-0 lg:w-48"
          >
            <div className="flex items-center gap-2">
              <span className="text-lav">{["◰", "◈", "◇", "◉"][i]}</span>
              <h3 className="font-display text-base font-bold text-ink">{n.name}</h3>
            </div>
            <p className="mt-1 text-xs text-muted">{n.sub}</p>
            <ul className="mt-3 space-y-1 border-t border-line pt-3 text-xs text-muted transition-colors group-hover:text-ink md:max-h-0 md:overflow-hidden md:border-t-0 md:pt-0 md:opacity-0 md:transition-all md:duration-300 md:group-hover:max-h-40 md:group-hover:border-t md:group-hover:pt-3 md:group-hover:opacity-100 md:group-focus-visible:max-h-40 md:group-focus-visible:border-t md:group-focus-visible:pt-3 md:group-focus-visible:opacity-100">
              {n.wires.map((w) => (
                <li key={w}>
                  <span className="text-mint">+</span> {w}
                </li>
              ))}
            </ul>
          </div>
          {i < NODES.length - 1 && (
            <div className="wire relative mx-auto h-16 w-px md:mx-0 md:mt-14 md:h-px md:w-auto md:min-w-20 md:flex-1" aria-hidden="true">
              {PACKETS[i].map((p) => (
                <span
                  key={p.g}
                  className={`packet whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] leading-none ${p.back ? "packet-back border-mint/30 bg-bg text-mint" : "border-lav/30 bg-bg text-lav"}`}
                  style={{ "--delay": p.delay, "--dur": "3.2s" } as CSSProperties}
                >
                  {p.g}
                </span>
              ))}
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
