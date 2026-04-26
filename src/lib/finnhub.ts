/**
 * Finnhub API client — server-side only (uses FINNHUB_API_KEY env var).
 * Free tier: 60 requests / minute.
 * Docs: https://finnhub.io/docs/api
 */

const BASE = "https://finnhub.io/api/v1";

function key() {
  const k = process.env.FINNHUB_API_KEY;
  if (!k || k === "your_key_here") throw new Error("FINNHUB_API_KEY not set in .env.local");
  return k;
}

/* ── Types ── */

export interface FinnhubQuote {
  c: number;   // current price
  d: number;   // change (absolute)
  dp: number;  // % change
  h: number;   // day high
  l: number;   // day low
  o: number;   // day open
  pc: number;  // previous close
  t: number;   // timestamp (unix)
}

export interface FinnhubCandles {
  c: number[];  // closes
  h: number[];  // highs
  l: number[];  // lows
  o: number[];  // opens
  v: number[];  // volumes
  t: number[];  // timestamps (unix seconds)
  s: "ok" | "no_data";
}

/* ── Helpers ── */

/**
 * Symbols that are not standard US equities need a Finnhub exchange prefix.
 * Most ADRs listed on NYSE/NASDAQ work with no prefix.
 * We only skip symbols that look like local-exchange tickers.
 */
const SKIP_PATTERN = /\.\w{2,3}$|^\d{4,}/;

export function isSupportedSymbol(symbol: string): boolean {
  return !SKIP_PATTERN.test(symbol);
}

/* ── API calls ── */

/**
 * Real-time quote for a US-listed symbol.
 * Responds in ~100-200ms.
 */
export async function fetchQuote(
  symbol: string,
  timeoutMs = 5000
): Promise<FinnhubQuote> {
  const url = `${BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${key()}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Finnhub quote HTTP ${res.status} for ${symbol}`);
  return res.json() as Promise<FinnhubQuote>;
}

/**
 * Daily OHLCV candles for a date range.
 * `from` and `to` are Unix timestamps (seconds).
 */
export async function fetchCandles(
  symbol: string,
  from: number,
  to: number,
  timeoutMs = 8000
): Promise<FinnhubCandles> {
  const url = `${BASE}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}&token=${key()}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Finnhub candle HTTP ${res.status} for ${symbol}`);
  return res.json() as Promise<FinnhubCandles>;
}

/** Unix timestamp helpers */
export function nowSecs() { return Math.floor(Date.now() / 1000); }
export function daysAgoSecs(n: number) { return nowSecs() - n * 86400; }
