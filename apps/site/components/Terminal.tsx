"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/glyphs";
import { site } from "@/lib/site";

type Tone = "ink" | "muted" | "lav" | "mint" | "bar";
type Line = { id: number; parts: { text: string; tone: Tone }[] };

const SPINNER = ["◒", "◐", "◓", "◑"];

type Step =
  | { kind: "type"; text: string }
  | { kind: "line"; parts: [string, Tone][]; wait?: number }
  | { kind: "select"; label: string; options: string[]; pick: number[] }
  | { kind: "text"; label: string; value: string }
  | { kind: "spin"; text: string; done: string; ms: number };

function scriptFor(mode: "create" | "add"): Step[] {
  return [
    { kind: "type", text: site.commands[mode] },
    { kind: "line", parts: [["┌  ", "bar"], ["donta / a little setup, a lot to build.", "lav"]], wait: 300 },
    { kind: "line", parts: [["│", "bar"]] },
    { kind: "select", label: "How would you like to connect Postgres?", options: ["Local Postgres / existing environment", "Connect Neon"], pick: [0] },
    ...(mode === "add" ? [
      { kind: "line", parts: [["◇  ", "mint"], ["Your setup plan", "ink"]] },
      { kind: "line", parts: [["│  + lib/donta/", "muted"]] },
      { kind: "line", parts: [["│  + app/api/auth/[...all]/route.ts", "muted"]] },
      { kind: "line", parts: [["│  ~ package.json · .env.local · .gitignore", "muted"]] },
      { kind: "select", label: "Apply this setup to your project?", options: ["Yes", "No"], pick: [0] },
    ] as Step[] : []),
    { kind: "select", label: "Install dependencies?", options: ["Yes", "No"], pick: [0] },
    { kind: "select", label: "Which package manager?", options: ["npm", "pnpm", "yarn", "bun"], pick: [0] },
    { kind: "spin", text: mode === "add" ? "Wiring up your backend" : "Creating your project", done: mode === "add" ? "Backend files are ready" : "Your project is ready", ms: 900 },
    { kind: "spin", text: "Installing dependencies", done: "Dependencies installed", ms: 1100 },
    { kind: "line", parts: [["│", "bar"]] },
    { kind: "line", parts: [["└  ", "bar"], [mode === "add" ? "Next: follow DONTA_SETUP.md" : "Next: cd my-app && npm run dev", "mint"]] },
  ];
}

// Every line shown when the demo is finished, used for reduced motion.
function finalLines(script: Step[]): Line[] {
  const out: Line[] = [];
  let id = 0;
  const push = (parts: [string, Tone][]) =>
    out.push({ id: id++, parts: parts.map(([text, tone]) => ({ text, tone })) });
  for (const s of script) {
    if (s.kind === "type") push([["$ ", "muted"], [s.text, "ink"]]);
    else if (s.kind === "line") push(s.parts);
    else if (s.kind === "text") {
      push([["◇  ", "mint"], [s.label, "ink"]]);
      push([["│  ", "bar"], [s.value, "muted"]]);
      push([["│", "bar"]]);
    } else if (s.kind === "select") {
      push([["◇  ", "mint"], [s.label, "ink"]]);
      push([["│  ", "bar"], [s.pick.map((p) => s.options[p]).join(", "), "muted"]]);
      push([["│", "bar"]]);
    } else push([["◇  ", "mint"], [s.done, "ink"]]);
  }
  return out;
}

const toneClass: Record<Tone, string> = {
  ink: "text-ink",
  muted: "text-muted",
  lav: "text-lav",
  mint: "text-mint",
  bar: "text-line",
};

export function Terminal({ onDone, mode = "create" }: { onDone?: () => void; mode?: "create" | "add" }) {
  const script = useMemo(() => scriptFor(mode), [mode]);
  const [lines, setLines] = useState<Line[]>([]);
  const [typing, setTyping] = useState("");
  const [done, setDone] = useState(false);
  const [run, setRun] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const play = useCallback(() => setRun((n) => n + 1), []);

  // Start once the terminal scrolls into view.
  useEffect(() => {
    const el = root.current!;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          play();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [play]);

  useEffect(() => {
    if (!run) return;
    if (prefersReducedMotion()) {
      setLines(finalLines(script));
      setDone(true);
      onDone?.();
      return;
    }

    let cancelled = false;
    let id = 0;
    const sleep = (ms: number) =>
      new Promise<void>((res, rej) =>
        setTimeout(() => (cancelled ? rej(new Error("cancelled")) : res()), ms),
      );
    const add = (parts: [string, Tone][]) => {
      const line = { id: id++, parts: parts.map(([text, tone]) => ({ text, tone })) };
      setLines((ls) => [...ls, line]);
      return line.id;
    };
    const replace = (lineId: number, parts: [string, Tone][]) =>
      setLines((ls) =>
        ls.map((l) =>
          l.id === lineId ? { id: l.id, parts: parts.map(([text, tone]) => ({ text, tone })) } : l,
        ),
      );
    const remove = (ids: number[]) => setLines((ls) => ls.filter((l) => !ids.includes(l.id)));

    async function go() {
      setLines([]);
      setDone(false);
      setTyping("");
      await sleep(500);

      for (const s of script) {
        if (s.kind === "type") {
          for (let i = 1; i <= s.text.length; i++) {
            setTyping(s.text.slice(0, i));
            await sleep(40 + Math.random() * 50);
          }
          await sleep(350);
          setTyping("");
          add([["$ ", "muted"], [s.text, "ink"]]);
        } else if (s.kind === "line") {
          add(s.parts);
          await sleep(s.wait ?? 120);
        } else if (s.kind === "text") {
          const head = add([["◆  ", "lav"], [s.label, "ink"]]);
          const input = add([["│  ", "lav"], ["", "ink"]]);
          for (let i = 1; i <= s.value.length; i++) {
            replace(input, [["│  ", "lav"], [s.value.slice(0, i), "ink"]]);
            await sleep(70);
          }
          await sleep(300);
          replace(head, [["◇  ", "mint"], [s.label, "ink"]]);
          replace(input, [["│  ", "bar"], [s.value, "muted"]]);
          add([["│", "bar"]]);
        } else if (s.kind === "select") {
          const multi = s.pick.length > 1;
          const head = add([["◆  ", "lav"], [s.label, "ink"]]);
          const chosen = new Set<number>();
          const optionParts = (cursor: number): [string, Tone][][] =>
            s.options.map((o, i) => {
              const on = multi ? chosen.has(i) : i === cursor;
              const mark = multi ? (on ? "◼ " : "◻ ") : on ? "● " : "○ ";
              return [
                ["│  ", "lav"],
                [mark, on ? "mint" : "muted"],
                [o, i === cursor ? "ink" : "muted"],
              ];
            });
          const ids = optionParts(0).map((p) => add(p));
          const render = (cursor: number) =>
            optionParts(cursor).forEach((p, i) => replace(ids[i], p));

          let cursor = 0;
          await sleep(450);
          for (const target of s.pick) {
            while (cursor !== target) {
              cursor += cursor < target ? 1 : -1;
              render(cursor);
              await sleep(260);
            }
            if (multi) {
              chosen.add(target);
              render(cursor);
              await sleep(260);
            }
          }
          await sleep(350);
          remove(ids);
          replace(head, [["◇  ", "mint"], [s.label, "ink"]]);
          add([["│  ", "bar"], [s.pick.map((p) => s.options[p]).join(", "), "muted"]]);
          add([["│", "bar"]]);
        } else if (s.kind === "spin") {
          const lineId = add([[SPINNER[0] + "  ", "lav"], [s.text, "ink"]]);
          const t0 = performance.now();
          let f = 0;
          while (performance.now() - t0 < s.ms) {
            f++;
            const dots = ".".repeat(f % 4);
            replace(lineId, [[SPINNER[f % 4] + "  ", "lav"], [s.text + dots, "ink"]]);
            await sleep(110);
          }
          replace(lineId, [["◇  ", "mint"], [s.done, "ink"]]);
        }
      }
      setDone(true);
      onDone?.();
    }

    go().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [run, onDone, script]);

  // Keep the newest line in view.
  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, typing]);

  return (
    <div
      ref={root}
      className="overflow-hidden rounded-lg border border-line bg-surface/90 shadow-2xl shadow-black/10 backdrop-blur dark:shadow-black/40"
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="ml-2 text-xs text-muted">~/projects</span>
        <button
          type="button"
          onClick={play}
          className="ml-auto min-h-11 px-2 text-xs text-muted transition-colors hover:text-lav disabled:opacity-40"
          disabled={!done}
          aria-label="Replay terminal demo"
        >
          ↻ replay
        </button>
      </div>
      <div
        ref={body}
        className="h-[25rem] overflow-hidden px-4 py-3 text-[13px] leading-[1.65] sm:h-[28rem]"
        aria-live="off"
      >
        <span className="sr-only">
          Demo: running {site.commands[mode]} configures Postgres, adds database and auth files,
          creates a private .env.local file, and installs dependencies. Existing apps get a change preview and integration guide.
        </span>
        <div aria-hidden="true">
          {lines.map((l) => (
            <div key={l.id} className="whitespace-pre-wrap break-words">
              {l.parts.map((p, i) => (
                <span key={i} className={toneClass[p.tone]}>
                  {p.text}
                </span>
              ))}
            </div>
          ))}
          {!done && (
            <div className="whitespace-pre">
              {typing || lines.length === 0 ? (
                <>
                  <span className="text-muted">$ </span>
                  <span className="text-ink">{typing}</span>
                </>
              ) : null}
              <span className="caret" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
