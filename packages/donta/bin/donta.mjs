#!/usr/bin/env node
// Setup ships with this package, so the CLI never fetches another CLI at runtime.
await import('../.cli/src/cli.mjs');
