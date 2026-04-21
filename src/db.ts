import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "bulk-deals.sqlite");

const db = new Database(dbPath);

const CREATE_BULK_DEALS = `
    CREATE TABLE IF NOT EXISTS bulk_deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      symbol TEXT,
      name TEXT,
      clientName TEXT,
      buySell TEXT,
      qty INTEGER,
      watp REAL,
      remarks TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      notified INTEGER DEFAULT 0,
      UNIQUE(date, symbol, clientName, buySell, qty, watp, remarks)
    )
  `;

function tableSql(): string | undefined {
  const row = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'bulk_deals'`)
    .get() as { sql: string } | undefined;
  return row?.sql;
}

/** Older DBs only keyed uniqueness on qty, so two prints at different prices could collapse. */
function needsUniqueMigration(sql: string): boolean {
  const compact = sql.replace(/\s+/g, " ");
  return (
    compact.includes("UNIQUE(date, symbol, clientName, buySell, qty)") &&
    !compact.includes("qty, watp, remarks)")
  );
}

function migrateBulkDealsUniqueToV2() {
  db.exec(`
    BEGIN;
    CREATE TABLE bulk_deals__migrated (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      symbol TEXT,
      name TEXT,
      clientName TEXT,
      buySell TEXT,
      qty INTEGER,
      watp REAL,
      remarks TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      notified INTEGER DEFAULT 0,
      UNIQUE(date, symbol, clientName, buySell, qty, watp, remarks)
    );
    INSERT OR IGNORE INTO bulk_deals__migrated (
      date, symbol, name, clientName, buySell, qty, watp, remarks, createdAt, notified
    )
    SELECT date, symbol, name, clientName, buySell, qty, watp, remarks, createdAt, notified
    FROM bulk_deals;
    DROP TABLE bulk_deals;
    ALTER TABLE bulk_deals__migrated RENAME TO bulk_deals;
    COMMIT;
  `);
}

const existingSql = tableSql();
if (!existingSql) {
  db.prepare(CREATE_BULK_DEALS).run();
} else if (needsUniqueMigration(existingSql)) {
  migrateBulkDealsUniqueToV2();
}

export default db;
