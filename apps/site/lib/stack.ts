// The layers donta wires together, shown in the stack diagram and indexed by search.

export const NODES = [
  {
    name: "Your app",
    sub: "Next.js App Router",
    wires: ["Typed session helpers", "Protected routes", "Sign-in / sign-up pages"],
  },
  {
    name: "Better Auth",
    sub: "email / password · sessions",
    wires: ["Mounted at /api/auth/*", "Drizzle adapter configured", "Secret generated for you"],
  },
  {
    name: "Drizzle",
    sub: "schema · queries · migrations",
    wires: ["Auth tables in your schema", "One migrate command", "Local or hosted Postgres"],
  },
  {
    name: "Postgres",
    sub: "PGlite locally · Neon hosted",
    wires: ["No account needed locally", "Set DATABASE_URL for Neon", "Same schema in both environments"],
  },
];
