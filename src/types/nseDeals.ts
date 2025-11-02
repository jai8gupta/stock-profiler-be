// src/types/nseDeals.ts

export interface DealEntry {
    /** Trading date (e.g., "31-Oct-2025") */
    date: string;
  
    /** NSE symbol (e.g., "RELIANCE") */
    symbol: string;
  
    /** Company name (e.g., "Reliance Industries Ltd") */
    name: string;
  
    /** Client name or counterparty (can be null) */
    clientName: string | null;
  
    /** Trade direction: BUY / SELL / null */
    buySell: "BUY" | "SELL" | null;
  
    /** Quantity of shares traded (string, because NSE returns as string) */
    qty: string;
  
    /** Weighted Average Traded Price (string, can be null) */
    watp: string | null;
  
    /** Optional remarks field */
    remarks: string | null;
  }
  
/** Root NSE Large Deal Response */
export interface NseLargeDealResponse {
  /** Reporting date (as shown by NSE, e.g., "31-Oct-2025") */
  as_on_date: string;

  /** Bulk deals summary count as string (e.g., "61") */
  BULK_DEALS: string;

  /** Short deals summary count as string (e.g., "68") */
  SHORT_DEALS: string;

  /** Block deals summary count as string (e.g., "2") */
  BLOCK_DEALS: string;

  /** Bulk deals array */
  BULK_DEALS_DATA: DealEntry[];

  /** Short deals array */
  SHORT_DEALS_DATA: DealEntry[];

  /** Block deals array */
  BLOCK_DEALS_DATA: DealEntry[];
}
  