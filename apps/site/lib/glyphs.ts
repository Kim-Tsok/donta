export const NOISE = "0123456789{}()[]<>=+-*/$#%&;:.,_|~^!?";

export function randomGlyph() {
  return NOISE[(Math.random() * NOISE.length) | 0];
}

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
