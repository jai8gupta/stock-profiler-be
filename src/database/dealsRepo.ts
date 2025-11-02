import db from "../db.ts";
import type { DealEntry } from "../types/nseDeals.ts";


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