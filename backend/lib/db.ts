import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// A single shared connection is reused across requests. We cache it on the
// global object so Next.js's dev-mode hot reloading doesn't open a new handle
// on every change.
const globalForDb = globalThis as unknown as { db?: Database.Database };

function createConnection(): Database.Database {
  const dbPath = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.join(process.cwd(), "data", "blog.db");

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      slug       TEXT    NOT NULL UNIQUE,
      content    TEXT    NOT NULL,
      excerpt    TEXT    NOT NULL DEFAULT '',
      published  INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL,
      updated_at TEXT    NOT NULL
    );
  `);

  return db;
}

export const db: Database.Database =
  globalForDb.db ?? (globalForDb.db = createConnection());
