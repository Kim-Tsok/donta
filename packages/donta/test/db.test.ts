import { sql } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { createDb } from "../src/db";

const note = pgTable("note", { id: text("id").primaryKey(), body: text("body").notNull() });

describe("createDb", () => {
  it("runs real queries on PGlite", async () => {
    const { db, driver } = createDb({ schema: { note }, database: { kind: "pglite", dir: "memory://" } });
    expect(driver).toBe("pglite");

    await db.execute(sql`create table note (id text primary key, body text not null)`);
    await db.insert(note).values({ id: "1", body: "hello" });
    const rows = await db.select().from(note);
    expect(rows).toEqual([{ id: "1", body: "hello" }]);

    // The relational API is typed from the schema passed in.
    const first = await db.query.note.findFirst();
    expect(first?.body).toBe("hello");
  });

  it("picks Neon without connecting on creation", () => {
    const { driver } = createDb({
      schema: { note },
      database: { kind: "neon", url: "postgresql://u:p@ep-x.neon.tech/db" },
    });
    // No network until the first query: creation alone must not throw.
    expect(driver).toBe("neon");
  });
});
