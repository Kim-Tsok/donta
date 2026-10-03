import {
  AWAKE,
  ELEPHANT_H,
  ELEPHANT_W,
  SLEEP,
  zPixels,
  toRuns,
} from "@/lib/elephant";

const sleepRuns = toRuns(SLEEP);
const awakeRuns = toRuns(AWAKE);

type Props = {
  awake?: boolean;
  /** Show floating z's (sleeping) and leave headroom for them. */
  zzz?: boolean;
  animated?: boolean;
  className?: string;
  title?: string;
};

export function Elephant({
  awake = false,
  zzz = false,
  animated = true,
  className,
  title = "donta elephant",
}: Props) {
  const runs = awake ? awakeRuns : sleepRuns;
  const body = runs.filter((r) => !r.eye);
  const eyes = runs.filter((r) => r.eye);
  // Headroom for the z's. Total height is 32 units, so h-24 / h-32 give 3px / 4px pixels.
  const pad = zzz ? 16 : 0;
  const viewBox = `0 ${-pad} ${ELEPHANT_W} ${ELEPHANT_H + pad}`;

  return (
    <svg
      viewBox={viewBox}
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label={title}
    >
      <g
        key={awake ? "awake" : "sleep"}
        className={animated ? (awake ? "ele-wake" : "ele-breathe") : undefined}
      >
        {body.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
        ))}
        <g className={animated && awake ? "ele-blink" : undefined}>
          {eyes.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
          ))}
        </g>
      </g>
      {zzz && !awake && (
        <g fill="currentColor" className="text-lav-deep">
          {[
            { x: 12, y: -5, n: 4, d: "0s" },
            { x: 6, y: -11, n: 5, d: "1.2s" },
            { x: 0, y: -16, n: 6, d: "2.4s" },
          ].map((z, i) => (
            <g key={i} className={animated ? "ele-z" : undefined} style={{ animationDelay: z.d }}>
              {zPixels(z.n).map(([x, y], j) => (
                <rect key={j} x={z.x + x} y={z.y + y} width={1} height={1} />
              ))}
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
