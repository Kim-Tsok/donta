import { createDb } from "donta/db";
import * as schema from "./schema";

// Neon over HTTP when DATABASE_URL is set, local PGlite in .donta/pglite otherwise.
export const { db, driver } = createDb({ schema });
