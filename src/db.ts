import Database from "better-sqlite3";

const db = new Database("bulkDeals.sqlite");


db.prepare(`
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
      UNIQUE(date, symbol, clientName, buySell, qty)
    )
  `).run();
  
  export default db;