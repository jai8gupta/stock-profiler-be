import axios from "axios";
import type { NseLargeDealResponse } from "../types/nseDeals.js";

const headers = {
  "User-Agent": "Mozilla/5.0",
  "Accept": "application/json",
  "Referer": "https://www.nseindia.com",
};

export async function fetchBulkDeals() {
  const url = `https://www.nseindia.com/api/snapshot-capital-market-largedeal?mode=bulk_deals`;
  const res = await axios.get(url, { headers });
  return res.data as NseLargeDealResponse;
}
