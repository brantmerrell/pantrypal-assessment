import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.DATA_DIR ?? "./data";
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, "pantrypal.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    preference TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const insertStmt = db.prepare(
  "INSERT INTO preferences (device_id, preference) VALUES (?, ?)",
);
const selectStmt = db.prepare(
  "SELECT preference FROM preferences WHERE device_id = ? ORDER BY id",
);

export function savePreference(deviceId: string, preference: string): void {
  insertStmt.run(deviceId, preference);
}

export function getPreferences(deviceId: string): string[] {
  const rows = selectStmt.all(deviceId) as { preference: string }[];
  return rows.map((r) => r.preference);
}
