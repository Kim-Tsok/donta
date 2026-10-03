// Original pixel elephant for donta. One character per pixel:
//   . empty   o outline   b body   h highlight   s ear shade
//   e eye     n nail/tusk
// Body rows are shared; only the head differs between poses.

export const SLEEP = `
....................oooooooo..........
.................ooohbbbbbbbooo.......
...............oohhbbbbbbbbbbbboo.....
..............ohhbbbbbbbbbbbbbbbbo....
........oooooobbbbbbbbbbbbbbbbbbbbo...
......oobbbbbbobbbbbbbbbbbbbbbbbbbbo..
.oo..ohbbbbbbbbossobbbbbbbbbbbbbbbbo..
ohbo.ohbbbbbbbbosssobbbbbbbbbbbbbbbbo.
obbo.obbbbbbbbbossssobbbbbbbbbbbbbbbo.
.obooobbbbbbbbbossssobbbbbbbbbbbbbbbbo
.obbobebbebbbbbossssobbbbbbbbbbbbbbbbo
.obbobbeebbbbbbosssobbbbbbbbbbbbbbbbbo
.obbobbbbbbbbbbbooobbbbbbbbbbbbbbbbbbo
.obbbobbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbo
.obbbbobbbbbbbonbnbnobbbbbbbbbbbbnbnbo
.ooooooooooooooooooooooooooooooooooooo
`;

export const AWAKE = `
....................oooooooo..........
.................ooohbbbbbbbooo.......
...............oohhbbbbbbbbbbbboo.....
..............ohhbbbbbbbbbbbbbbbbo....
.oo.....oooooobbbbbbbbbbbbbbbbbbbbo...
ohbo..oobbbbbbobbbbbbbbbbbbbbbbbbbbo..
obbo.ohbbbbbbbbossobbbbbbbbbbbbbbbbo..
.obo.ohbbbbbbbbosssobbbbbbbbbbbbbbbbo.
.obbooobbbbbbbbossssobbbbbbbbbbbbbbbo.
.obbbbbbneebbbbossssobbbbbbbbbbbbbbbbo
.obbbbbbeebbbbbossssobbbbbbbbbbbbbbbbo
..obbbbbbbbbbbbosssobbbbbbbbbbbbbbbbbo
..obbbbbbbbbbbbbooobbbbbbbbbbbbbbbbbbo
..obnobbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbo
..obbnbbbbbbbbonbnbnobbbbbbbbbbbbnbnbo
..oooooooooooooooooooooooooooooooooooo
`;

export const PALETTE: Record<string, string> = {
  o: "#0b0c10",
  b: "#bfcbf0",
  h: "#dee4fa",
  s: "#a0ade0",
  e: "#0b0c10",
  n: "#f2f3f7",
};

export const ELEPHANT_W = 38;
export const ELEPHANT_H = 16;

export type Run = { x: number; y: number; w: number; c: string; eye: boolean };

/** Merge horizontal runs of the same colour into single rects. */
export function toRuns(grid: string): Run[] {
  const rows = grid.trim().split("\n");
  const runs: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      let w = 1;
      while (row[x + w] === ch) w++;
      runs.push({ x, y, w, c: PALETTE[ch], eye: ch === "e" });
      x += w;
    }
  });
  return runs;
}

/** An n×n pixel "z" used for the sleeping animation. */
export function zPixels(n: number): [number, number][] {
  const px: [number, number][] = [];
  for (let x = 0; x < n; x++) px.push([x, 0], [x, n - 1]);
  for (let y = 1; y < n - 1; y++) px.push([n - 1 - y, y]);
  return px;
}
