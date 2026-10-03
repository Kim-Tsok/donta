"use client";

import { useEffect, useRef } from "react";
import { NOISE, prefersReducedMotion } from "@/lib/glyphs";

// A drifting field of numbers and symbols. Glyphs near the cursor (and in a
// slow ambient sweep) light up in the accent colour and scramble faster.
const FONT_SIZE = 13;
const CELL_W = 8;
const CELL_H = 22;
const DRIFT = 6; // px per second, upward
const RADIUS = 150;
const NOISE_DENSITY = 0.32;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.trim().replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function GlyphField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = prefersReducedMotion();

    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let noise: string[][] = [];
    let alpha: Float32Array[] = [];
    let offset = 0;
    let raf = 0;
    let running = false;
    let visible = true;
    let last = 0;
    const pointer = { x: -9999, y: -9999, active: false };

    const font = `${FONT_SIZE}px ${getComputedStyle(document.body).fontFamily}`;

    // Colours come from the theme tokens and update when the theme changes.
    let base = hexToRgb("#8a90a6");
    let hi = hexToRgb("#bfcbf0");
    function readColors() {
      const css = getComputedStyle(document.documentElement);
      base = hexToRgb(css.getPropertyValue("--glyph") || "#8a90a6");
      hi = hexToRgb(css.getPropertyValue("--glyph-hi") || "#bfcbf0");
    }
    readColors();
    const themeObserver = new MutationObserver(() => {
      readColors();
      draw(performance.now());
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL_W) + 1;
      rows = Math.ceil(h / CELL_H) + 2;
      noise = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () =>
          Math.random() < NOISE_DENSITY ? NOISE[(Math.random() * NOISE.length) | 0] : " ",
        ),
      );
      alpha = Array.from({ length: rows }, () => {
        const a = new Float32Array(cols);
        for (let i = 0; i < cols; i++) a[i] = 0.05 + Math.random() * 0.14;
        return a;
      });
    }

    function draw(t: number) {
      ctx.clearRect(0, 0, w, h);
      ctx.font = font;
      ctx.textBaseline = "middle";

      // Ambient decode sweep: a soft diagonal band crossing every ~9s.
      const sweep = ((t / 9000) % 1) * (w + h * 0.6) - h * 0.3;

      const shift = offset % CELL_H;
      const first = Math.floor(offset / CELL_H);

      for (let r = 0; r < rows; r++) {
        const rowIndex = (r + first) % rows;
        const y = r * CELL_H - shift + CELL_H / 2;
        const nrow = noise[rowIndex];
        const arow = alpha[rowIndex];

        for (let c = 0; c < cols; c++) {
          const ch = nrow[c];
          if (ch === " ") continue;
          const x = c * CELL_W;
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          let glow = pointer.active ? Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / RADIUS) : 0;
          const sd = Math.abs(x + y * 0.6 - sweep);
          if (!reduced && sd < 60) glow = Math.max(glow, (1 - sd / 60) * 0.5);

          if (glow > 0.05) {
            ctx.fillStyle = `rgba(${hi[0]},${hi[1]},${hi[2]},${arow[c] + glow * 0.85})`;
          } else {
            ctx.fillStyle = `rgba(${base[0]},${base[1]},${base[2]},${arow[c]})`;
          }
          ctx.fillText(ch, x, y);
        }
      }
    }

    function scrambleNearPointer() {
      if (!pointer.active) return;
      const shift = Math.floor(offset / CELL_H);
      const pr = Math.floor((pointer.y + (offset % CELL_H)) / CELL_H);
      const pc = Math.floor(pointer.x / CELL_W);
      const span = Math.ceil(RADIUS / CELL_W);
      for (let i = 0; i < 40; i++) {
        const r = pr + (((Math.random() * 2 - 1) * RADIUS) / CELL_H) | 0;
        const c = pc + ((Math.random() * 2 - 1) * span) | 0;
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
        const row = noise[(r + shift) % rows];
        if (row[c] !== " ") row[c] = NOISE[(Math.random() * NOISE.length) | 0];
      }
    }

    function mutate(n: number) {
      for (let i = 0; i < n; i++) {
        const r = (Math.random() * rows) | 0;
        const c = (Math.random() * cols) | 0;
        noise[r][c] =
          Math.random() < NOISE_DENSITY ? NOISE[(Math.random() * NOISE.length) | 0] : " ";
      }
    }

    function frame(t: number) {
      if (!running) return;
      const dt = last ? Math.min(64, t - last) : 16;
      // Throttle to ~30fps; this is ambience, not a game.
      if (t - last >= 32) {
        last = t;
        offset += (DRIFT * dt) / 1000;
        mutate(Math.ceil(cols * rows * 0.004));
        scrambleNearPointer();
        draw(t);
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduced || !visible || document.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function onPointer(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active =
        pointer.x >= -RADIUS && pointer.y >= -RADIUS && pointer.x <= w + RADIUS && pointer.y <= h + RADIUS;
      if (reduced) draw(0);
    }

    function onLeave() {
      pointer.active = false;
      if (reduced) draw(0);
    }

    resize();
    draw(0);

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    start();

    return () => {
      stop();
      themeObserver.disconnect();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
