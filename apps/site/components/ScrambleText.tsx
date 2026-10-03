"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion, randomGlyph } from "@/lib/glyphs";

type Props = {
  text: string;
  /** Decode once on mount. */
  onMount?: boolean;
  /** Re-run the decode on hover/focus. */
  onHover?: boolean;
  delay?: number;
  duration?: number;
  className?: string;
};

export function ScrambleText({
  text,
  onMount = true,
  onHover = false,
  delay = 0,
  duration = 1100,
  className,
}: Props) {
  const [out, setOut] = useState(text);
  const timer = useRef<number | undefined>(undefined);

  const run = useCallback(() => {
    if (prefersReducedMotion()) return;
    clearInterval(timer.current);
    // Each character resolves at its own moment, roughly left to right.
    const at = [...text].map((_, i) => (i / text.length) * 0.65 + Math.random() * 0.35);
    const start = performance.now();
    timer.current = window.setInterval(() => {
      const p = (performance.now() - start) / duration;
      if (p >= 1) {
        clearInterval(timer.current);
        setOut(text);
        return;
      }
      setOut([...text].map((ch, i) => (ch === " " || p >= at[i] ? ch : randomGlyph())).join(""));
    }, 40);
  }, [text, duration]);

  useEffect(() => {
    if (!onMount) return;
    const t = setTimeout(run, delay);
    return () => {
      clearTimeout(t);
      clearInterval(timer.current);
    };
  }, [onMount, delay, run]);

  return (
    <span
      className={className}
      onMouseEnter={onHover ? run : undefined}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{out}</span>
    </span>
  );
}
