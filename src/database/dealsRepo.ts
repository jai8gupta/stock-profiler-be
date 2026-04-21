import db from "../db.js";
import type { DealEntry } from "../types/nseDeals.js";

type BulkDealRow = {
  date: string;
  symbol: string;
  name: string;
  clientName: string | null;
  buySell: string | null;
  qty: number;
  watp: number | null;
  remarks: string | null;
};

function parseNseDisplayDate(s: string): number {
  const t = new Date(s.replaceAll("-", " ")).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function rowToDealEntry(row: BulkDealRow): DealEntry {
  return {
    date: row.date,
    symbol: row.symbol,
    name: row.name,
    clientName: row.clientName,
    buySell: row.buySell as DealEntry["buySell"],
    qty: String(row.qty),
    watp: row.watp != null ? String(row.watp) : null,
    remarks: row.remarks,
  };
}

/** Deals for up to `maxDays` most recent distinct reporting dates in the DB. */
export function getDealsForRecentDistinctDays(maxDays: number): DealEntry[] {
  const distinctStmt = db.prepare(
    `SELECT DISTINCT date FROM bulk_deals WHERE date IS NOT NULL AND TRIM(date) != ''`,
  );
  const dateRows = distinctStmt.all() as { date: string }[];
  if (dateRows.length === 0) return [];

  const sortedDates = [...new Set(dateRows.map((r) => r.date.trim()))]
    .filter(Boolean)
    .sort((a, b) => parseNseDisplayDate(b) - parseNseDisplayDate(a))
    .slice(0, maxDays);

  if (sortedDates.length === 0) return [];

  const placeholders = sortedDates.map(() => "?").join(", ");
  const stmt = db.prepare(
    `SELECT date, symbol, name, clientName, buySell, qty, watp, remarks
     FROM bulk_deals
     WHERE date IN (${placeholders})
     ORDER BY date DESC, symbol ASC`,
  );
  const rows = stmt.all(...sortedDates) as BulkDealRow[];
  return rows.map(rowToDealEntry);
}

export function insertDeal(deal: DealEntry) {
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO bulk_deals 
        (date, symbol, name, clientName, buySell, qty, watp, remarks)
        VALUES (@date, @symbol, @name, @clientName, @buySell, @qty, @watp, @remarks)
      `);

    const info = {
        ...deal,
        qty: deal.qty ? Number(deal.qty) : 0,
        watp: deal.watp ? Number(deal.watp) : null,
      };
    const res = stmt.run(info);
    return res.changes > 0;
}

export function insertMany(deals: DealEntry[]) {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO bulk_deals 
      (date, symbol, name, clientName, buySell, qty, watp, remarks)
      VALUES (@date, @symbol, @name, @clientName, @buySell, @qty, @watp, @remarks)
    `);
    const tx = db.transaction((arr: DealEntry[]) => {
      const inserted: DealEntry[] = [];
      for (const d of arr) {
        const info = {
          ...d,
          qty: d.qty ? Number(d.qty) : 0,
          watp: d.watp ? Number(d.watp) : null,
        };
        const res = insert.run(info);
        if (res.changes > 0) inserted.push(d);
      }
      return inserted;
    });
    return tx(deals);
  }
  
  export function getDealsByDate(date: string) {
    const stmt = db.prepare(`SELECT * FROM bulk_deals WHERE date = ?`);
    return stmt.all(date);
  }