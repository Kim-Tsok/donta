// The layers donta wires together, shown in the stack diagram and indexed by search.

export const NODES = [
  {
    name: "Your app",
    sub: "Next.js · React + Hono",
    wires: ["Typed session helpers", "Protected routes", "Sign-in / sign-up pages"],
  },
  {
    name: "Better Auth",
    sub: "sessions · OAuth · passkeys",
    wires: ["Mounted at /api/auth/*", "Drizzle adapter configured", "Secret generated for you"],
  },
  {
    name: "Drizzle",
    sub: "schema · queries · migrations",
    wires: ["Auth tables in your schema", "One migrate command", "Driver chosen per runtime"],
  },
  {
    name: "Neon",
    sub: "serverless Postgres",
    wires: ["HTTP driver for edge", "Branch per preview deploy", "Or local PGlite in dev"],
  },
];
