"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { site } from "@/lib/site";
import { FRAMEWORKS } from "@/lib/snippets";
import { NODES } from "@/lib/stack";
import { currentTheme, setTheme } from "@/lib/theme";

export const SHOW_CODE_EVENT = "donta:show-code";
export type ShowCode = { framework: string; file: number };

type Item = {
  id: string;
  group: "Page" | "Code" | "Links" | "Actions";
  title: string;
  hint?: string;
  keywords?: string;
  run: () => void;
};

function go(hash: string) {
  document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", hash);
}

function buildIndex(): Item[] {
  const items: Item[] = [
    { id: "top", group: "Page", title: "Home", hint: site.headline, run: () => go("#top") },
    {
      id: "stack",
      group: "Page",
      title: "How it fits together",
      hint: "App → Better Auth → Drizzle → Neon",
      keywords: "stack architecture diagram layers",
      run: () => go("#stack"),
    },
    ...NODES.map((n) => ({
      id: `node-${n.name}`,
      group: "Page" as const,
      title: n.name,
      hint: n.sub,
      keywords: n.wires.join(" "),
      run: () => go("#stack"),
    })),
    ...FRAMEWORKS.flatMap((f) =>
      f.files.map((file, i) => ({
        id: `code-${f.id}-${file.file}`,
        group: "Code" as const,
        title: file.file,
        hint: f.name,
        keywords: file.code,
        run: () => {
          window.dispatchEvent(
            new CustomEvent<ShowCode>(SHOW_CODE_EVENT, { detail: { framework: f.id, file: i } }),
          );
          go("#code");
        },
      })),
    ),
    {
      id: "copy",
      group: "Actions",
      title: "Copy install command",
      hint: site.install,
      keywords: "npm create install start",
      run: () => void navigator.clipboard?.writeText(site.install).catch(() => {}),
    },
    {
      id: "theme",
      group: "Actions",
      title: "Toggle light / dark mode",
      keywords: "theme colour color appearance",
      run: () => setTheme(currentTheme() === "light" ? "dark" : "light"),
    },
    {
      id: "github",
      group: "Links",
      title: "GitHub",
      hint: "source code",
      run: () => window.open(site.links.github, "_blank", "noreferrer"),
    },
    {
      id: "npm",
      group: "Links",
      title: "npm",
      hint: "create-donta",
      run: () => window.open(site.links.npm, "_blank", "noreferrer"),
    },
  ];
  return items;
}

function score(item: Item, q: string) {
  if (!q) return 1;
  const title = item.title.toLowerCase();
  if (title.startsWith(q)) return 4;
  if (title.includes(q)) return 3;
  if ((item.hint ?? "").toLowerCase().includes(q)) return 2;
  if ((item.keywords ?? "").toLowerCase().includes(q)) return 1;
  return 0;
}

function MagnifierIcon() {
  const rows = ["..ooo...", ".o...o..", "o.....o.", "o.....o.", "o.....o.", ".o...o..", "..ooooo.", "......oo"];
  return (
    <svg viewBox="0 0 8 8" className="size-4" shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === "o" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" /> : null,
        ),
      )}
    </svg>
  );
}

export function Search() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [mac, setMac] = useState(true);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const index = useMemo(buildIndex, []);

  const q = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      index
        .map((item) => ({ item, s: score(item, q) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((r) => r.item),
    [index, q],
  );

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    function onKey(e: KeyboardEvent) {
      const typing =
        e.target instanceof HTMLElement &&
        (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => input.current?.focus());
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  // Keep the highlighted result visible while arrowing through a long list.
  useEffect(() => {
    const item = results[active];
    if (open && item) document.getElementById(`search-${item.id}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, results]);

  function close(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }

  function choose(item: Item) {
    close(false);
    item.run();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      // Keep focus inside the dialog; the input is its only stop.
      e.preventDefault();
    }
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-md border border-line px-2.5 text-sm text-muted transition-colors hover:border-lav/60 hover:text-lav sm:w-52 sm:px-3"
        aria-label="Search"
        aria-haspopup="dialog"
      >
        <MagnifierIcon />
        <span className="hidden sm:inline">search</span>
        <kbd className="ml-auto hidden rounded border border-line px-1.5 py-0.5 text-[10px] text-muted sm:inline">
          {mac ? "⌘" : "Ctrl "}K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-bg/70 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => close()}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search the site"
            className="w-full max-w-lg overflow-hidden rounded-lg border border-line bg-surface shadow-2xl shadow-black/30"
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <span className="text-muted">
                <MagnifierIcon />
              </span>
              <input
                ref={input}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Search pages, code and actions"
                className="h-12 w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted focus-visible:outline-none"
                role="combobox"
                aria-expanded="true"
                aria-controls="search-results"
                aria-activedescendant={results[active] ? `search-${results[active].id}` : undefined}
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">esc</kbd>
            </div>

            <ul id="search-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-muted">
                  Nothing matches &ldquo;{query}&rdquo;. Full docs are coming soon.
                </li>
              )}
              {results.map((item, i) => {
                const showGroup = i === 0 || results[i - 1].group !== item.group;
                return (
                  <li key={item.id} role="presentation">
                    {showGroup && !q && (
                      <p className="px-3 pb-1 pt-3 text-xs text-muted">
                        {item.group}
                      </p>
                    )}
                    <div
                      id={`search-${item.id}`}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={() => choose(item)}
                      className={`flex cursor-pointer items-baseline gap-3 rounded-md px-3 py-2 text-sm ${i === active ? "bg-lav text-bg" : "text-ink"}`}
                    >
                      <span className="shrink-0">{item.title}</span>
                      {item.hint && (
                        <span className={`truncate text-xs ${i === active ? "text-bg/75" : "text-muted"}`}>
                          {item.hint}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex gap-4 border-t border-line px-4 py-2 text-[10px] text-muted">
              <span>↑↓ move</span>
              <span>↵ open</span>
              <span>esc close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
