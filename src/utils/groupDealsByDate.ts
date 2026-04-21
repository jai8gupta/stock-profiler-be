import type { DealEntry } from "../types/nseDeals.js";

/** Preserves order of first appearance of each `date` (expects `deals` sorted by date desc). */
export function groupDealsByDate(deals: DealEntry[]): { date: string; deals: DealEntry[] }[] {
  const days: { date: string; deals: DealEntry[] }[] = [];
  for (const deal of deals) {
    const last = days[days.length - 1];
    if (last && last.date === deal.date) {
      last.deals.push(deal);
    } else {
      days.push({ date: deal.date, deals: [deal] });
    }
  }
  return days;
}
