import axios from "axios";
import fs from "fs";
import { getDateRange } from "../../utils/dates.js";
import dotenv from "dotenv";
import jsonTokens from "./tokens.json" with { type: "json" };

dotenv.config();
export async function filterByVolume(apiKey: string, accessToken: string) {
    console.log("apiKey", apiKey);
    console.log("accessToken", accessToken);
  const instruments = JSON.parse(fs.readFileSync("./instruments.json", "utf8"));

  const { from, to } = getDateRange(10); // last 10 days
    const TOKEN = `${apiKey}:${accessToken}`;
    const headers = { Authorization: `token ${TOKEN}`, 'X-Kite-Version': 3 };

  let enriched: any[] = [];

  for (const inst of instruments.slice(300, 1200)) {
    try {
      const resp = await axios.get(
        `https://api.kite.trade/instruments/historical/${inst.token}/day?from=${from}&to=${to}`,
        { headers }
      );
  
      const candles = resp.data.data.candles;
      const avgVol =
        candles.slice(-5).reduce((s: number, c: any) => s + c[5], 0) / 5;
  
      enriched.push({
        token: inst.token,
        symbol: inst.tradingsymbol,
        avgVol
      });
    } catch (err) {
      console.log("error in filterByVolume:", err);
      console.log("Failed:", inst.token);
    }
  
    await sleep(250); // 👈 throttle to 4 req/sec
  }
  

  enriched.sort((a, b) => b.avgVol - a.avgVol);
  const selected = enriched.slice(0, 700);  // dynamic watchlist
  fs.writeFileSync("./watchlist.json", JSON.stringify(selected, null, 2));

  console.log(`Selected ${selected.length} most liquid stocks.`);
  return selected;
}
filterByVolume(process.env.KITE_API_KEY as string, jsonTokens.access_token as string);

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  