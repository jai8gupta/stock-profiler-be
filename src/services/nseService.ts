import axios from "axios";

const headers = {
  "User-Agent": "Mozilla/5.0",
  "Accept": "application/json",
  "Referer": "https://www.nseindia.com",
};

export async function fetchShareholding(symbol: string) {
  const url = `https://www.nseindia.com/api/corporates-shareholdings?symbol=${symbol}`;
  const res = await axios.get(url, { headers });
  return res.data;
}
