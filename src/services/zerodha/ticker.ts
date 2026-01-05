// src/kite/ticker.ts
import { KiteTicker } from "kiteconnect";
import fs from "node:fs";
import dotenv from "dotenv";
import jsonTokens from "./tokens.json" with { type: "json" };

dotenv.config();

// Track state per instrument
interface InstrumentState {
  prevVolume: number;
  prevPrice: number;
  priceHistory: number[]; // Last 5 prices for momentum
  lastAlertTime: number; // Prevent spam
}

const state: Record<number, InstrumentState> = {};
const ALERT_COOLDOWN = 60000; // 1 minute between alerts for same stock

export function startTicker(apiKey: string, accessToken: string) {
  const ticker = new KiteTicker({ api_key: apiKey, access_token: accessToken });

  ticker.connect();

  ticker.on("connect", () => {
    console.log("📡 WebSocket Connected");

    const watchlist = JSON.parse(fs.readFileSync("./watchlist.json", "utf8"));
    const tokens = watchlist.map((s: any) => s.token);

    ticker.subscribe(tokens);
    ticker.setMode(ticker.modeFull, tokens);

    console.log("👀 Watching", tokens.length, "stocks...");
  });

  ticker.on("ticks", (ticks) => {
    ticks.forEach((tick) => processTick(tick));
  });

  ticker.on("error", (err) => console.log("❌ WS Error", err));
}

function processTick(tick: any) {
  const {
    instrument_token,
    last_price,
    depth,
    tradingsymbol,
    average_traded_price,
    ohlc,
    change,
    total_buy_quantity,
    total_sell_quantity,
  } = tick;

  const volume = tick.volume || tick.volume_traded || 0;

  if (!depth || !ohlc) return;

  // Initialize state if needed
  if (!state[instrument_token]) {
    state[instrument_token] = {
      prevVolume: volume,
      prevPrice: last_price,
      priceHistory: [last_price],
      lastAlertTime: 0,
    };
    return;
  }

  const instState = state[instrument_token];
  const now = Date.now();

  // Update price history (keep last 5)
  instState.priceHistory.push(last_price);
  if (instState.priceHistory.length > 5) {
    instState.priceHistory.shift();
  }

  // ✅ FIX 1: Check price is actually going UP
  const priceChange = change || ((last_price - ohlc.close) / ohlc.close) * 100;
  if (priceChange <= 0) {
    instState.prevVolume = volume;
    instState.prevPrice = last_price;
    return; // Stock is down, ignore
  }

  // ✅ FIX 2: Use BOTH order book depth (leading indicator) AND executed trades
  // Order book shows pending interest, executed shows actual activity
  const depthBuy = depth.buy.reduce((s: number, b: any) => s + b.quantity, 0);
  const depthSell = depth.sell.reduce((s: number, s2: any) => s + s2.quantity, 0);
  const orderBookRatio = depthBuy / Math.max(1, depthSell);
  
  const executedBuyRatio =
    total_buy_quantity / Math.max(1, total_sell_quantity);

  // ✅ FIX 3: Better volume spike - use absolute delta, not percentage
  // Percentage doesn't work well with cumulative volumes
  const volumeDelta = volume - instState.prevVolume;
  const volumeSpike = volumeDelta > 1000; // Absolute threshold: at least 1000 shares traded

  // ✅ FIX 4: Price momentum - check if price is trending up
  const priceMomentum = calculateMomentum(instState.priceHistory);
  const hasPositiveMomentum = priceMomentum > 0;

  // ✅ FIX 5: Price vs Average - if LTP > avg, it's above average
  const priceAboveAverage =
    average_traded_price ? last_price > average_traded_price : true;

  // ✅ FIX 6: Cooldown to prevent spam
  const timeSinceLastAlert = now - instState.lastAlertTime;
  if (timeSinceLastAlert < ALERT_COOLDOWN) {
    instState.prevVolume = volume;
    instState.prevPrice = last_price;
    return;
  }

  // Combined signal: Price up + Volume spike + Buy pressure + Momentum
  // Use order book ratio (leading) OR executed ratio (confirming)
  const buyPressure = orderBookRatio > 3 || executedBuyRatio > 1.5;
  
  if (
    priceChange > 0.3 && // At least 0.3% up (lowered threshold)
    buyPressure && // Either order book or executed shows buying
    volumeSpike && // Volume increased
    (hasPositiveMomentum || priceAboveAverage) // Price trending up OR above average
  ) {
    const timestamp = new Date().toLocaleTimeString("en-IN", { hour12: false });
    console.log(tick);

    const log = `🚨 ${timestamp} | ${tradingsymbol || "N/A"} (${instrument_token}) | LTP=${last_price} | Change=${priceChange.toFixed(
      2
    )}% | BuyRatio=${executedBuyRatio.toFixed(2)} | ΔVol=${volumeDelta} | Momentum=${priceMomentum.toFixed(2)}% | Avg=${average_traded_price?.toFixed(2) || "N/A"}`;

    console.log(log);
    fs.appendFileSync("spikes.log", log + "\n");
    instState.lastAlertTime = now;
  }

  // Update state
  instState.prevVolume = volume;
  instState.prevPrice = last_price;
}

function calculateMomentum(prices: number[]): number {
  if (prices.length < 2) return 0;
  const recent = prices.slice(-3); // Last 3 prices
  const oldest = recent[0];
  const newest = recent.at(-1);
  if (!oldest || !newest || oldest === 0) return 0;
  return ((newest - oldest) / oldest) * 100;
}

// start automatically
startTicker(process.env.KITE_API_KEY as string, jsonTokens.access_token as string);
