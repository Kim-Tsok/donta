"use client";

import { useEffect, useState } from "react";
import { currentTheme, setTheme, THEME_EVENT, type Theme } from "@/lib/theme";

// 8×8 pixel icons to match the elephant.
const SUN = ["...o....", ".o...o..", "...oo...", "o.oooo.o", "..oooo..", "...oo...", ".o...o..", "...o...."];
const MOON = ["..ooo...", ".oo.....", "oo......", "oo......", "oo......", "ooo...o.", ".oooooo.", "..oooo.."];

function PixelIcon({ rows }: { rows: string[] }) {
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

export function ThemeToggle() {
  const [theme, setLocal] = useState<Theme | null>(null);

  useEffect(() => {
    setLocal(currentTheme());
    const on = (e: Event) => setLocal((e as CustomEvent<Theme>).detail);
    window.addEventListener(THEME_EVENT, on);
    return () => window.removeEventListener(THEME_EVENT, on);
  }, []);

  const next = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="grid size-9 place-items-center rounded-md border border-line text-muted transition-colors hover:border-lav/60 hover:text-lav"
      aria-label={theme ? `Switch to ${next} mode` : "Toggle colour theme"}
      title={theme ? `Switch to ${next} mode` : undefined}
    >
      {/* Render nothing until mounted: the server can't know the theme. */}
      {theme && <PixelIcon rows={theme === "light" ? MOON : SUN} />}
    </button>
  );
}
