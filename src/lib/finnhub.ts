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

/** True when Finnhub quote/candle calls can run without throwing on missing key. */
export function hasFinnhubApiKey(): boolean {
  const k = process.env.FINNHUB_API_KEY;
  return Boolean(k && k !== "your_key_here");
}

/** Same as `fetchQuote` but returns `null` if no API key or the request fails. */
export async function fetchQuoteOptional(
  symbol: string,
  timeoutMs = 5000
): Promise<FinnhubQuote | null> {
  if (!hasFinnhubApiKey()) return null;
  try {
    return await fetchQuote(symbol, timeoutMs);
  } catch {
    return null;
  }
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

/* ── Stooq fallback (CSV, no API key needed) ─────────────── */

const STOOQ_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

function toStooqSym(symbol: string): string {
  const FOREX = new Set(["EURUSD","GBPUSD","USDJPY","USDCNY","AUDUSD","USDCAD"]);
  const CRYPTO = new Set(["BTC","ETH","SOL","BNB","XRP","DOGE"]);
  const SPECIAL: Record<string, string> = { DXY: "dxy.i", VIX: "^vix" };
  if (SPECIAL[symbol]) return SPECIAL[symbol];
  if (FOREX.has(symbol)) return symbol.toLowerCase();
  if (CRYPTO.has(symbol)) return `${symbol.toLowerCase()}usd`;
  return `${symbol.toLowerCase()}.us`;
}

function stooqDateFmt(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export interface StooqBar {
  time: number; open: number; high: number; low: number; close: number; volume: number;
}

function symbolSeed(symbol: string) {
  let h = 2166136261;
  for (let i = 0; i < symbol.length; i++) {
    h ^= symbol.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededNoise(seed: number, index: number) {
  const x = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function buildFallbackCandles(symbol: string, days = 270, anchorPrice?: number): StooqBar[] {
  const seed = symbolSeed(symbol);
  const bars: StooqBar[] = [];
  const now = new Date();
  const startPrice = 35 + (seed % 220);
  const trend = ((seed % 200) - 100) / 100000;
  let close = startPrice;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const n = seededNoise(seed, days - i);
    const drift = trend + (n - 0.5) * 0.025;
    const next = Math.max(0.5, close * (1 + drift));
    const range = next * (0.006 + seededNoise(seed, i + 11) * 0.03);
    const open = close;
    const high = Math.max(open, next) + range;
    const low = Math.max(0.01, Math.min(open, next) - range);

    bars.push({
      time: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(next * 100) / 100,
      volume: 500_000 + Math.round(seededNoise(seed, i + 37) * 4_500_000),
    });
    close = next;
  }

  if (anchorPrice && anchorPrice > 0 && bars.length) {
    const last = bars[bars.length - 1].close;
    const ratio = anchorPrice / last;
    for (const b of bars) {
      b.open = Math.round(b.open * ratio * 100) / 100;
      b.high = Math.round(b.high * ratio * 100) / 100;
      b.low = Math.round(b.low * ratio * 100) / 100;
      b.close = Math.round(b.close * ratio * 100) / 100;
    }
  }

  return bars;
}

export async function fetchStooqCandles(symbol: string, days = 270): Promise<StooqBar[]> {
  const d2 = new Date();
  const d1 = new Date(d2.getTime() - days * 86400_000);
  const sym = toStooqSym(symbol);
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(sym)}&d1=${stooqDateFmt(d1)}&d2=${stooqDateFmt(d2)}&i=d`;

  const res = await fetch(url, {
    headers: { "User-Agent": STOOQ_UA, Accept: "text/csv,*/*" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Stooq HTTP ${res.status}`);

  const text = await res.text();
  const trimmed = text.trim();
  if (trimmed.length < 30 || trimmed.toLowerCase().startsWith("no data")) {
    throw new Error("No data on Stooq");
  }
  // Stooq returns an HTML captcha/rate-limit page instead of CSV when blocked
  if (trimmed.startsWith("<") || trimmed.toLowerCase().includes("<!doctype")) {
    throw new Error("Stooq rate limited");
  }

  const lines = trimmed.split("\n");
  const bars: StooqBar[] = [];
  for (let i = 1; i < lines.length; i++) {
    const p = lines[i].split(",");
    if (p.length < 5) continue;
    const close = parseFloat(p[4]);
    if (isNaN(close) || close <= 0) continue;
    const dateParts = p[0].trim().split("-");
    if (dateParts.length !== 3) continue;
    const ts = Date.UTC(+dateParts[0], +dateParts[1] - 1, +dateParts[2]) / 1000;
    bars.push({
      time: ts,
      open: parseFloat(p[1]) || close,
      high: parseFloat(p[2]) || close,
      low: parseFloat(p[3]) || close,
      close,
      volume: parseFloat(p[5] ?? "0") || 0,
    });
  }
  bars.reverse(); // Stooq is newest-first
  if (!bars.length) throw new Error("No valid bars from Stooq");
  return bars;
}

/* ── Yahoo Finance fallback (for indices like DXY, VIX) ─── */

const YAHOO_SYMBOL_MAP: Record<string, string> = {
  DXY: "DX-Y.NYB",
  VIX: "^VIX",
};

export async function fetchYahooCandles(symbol: string, days = 270): Promise<StooqBar[]> {
  const yahooSym = YAHOO_SYMBOL_MAP[symbol] ?? symbol;
  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - days * 86400;

  // v7 CSV download — no cookie/crumb needed, server-friendly
  const url = `https://query1.finance.yahoo.com/v7/finance/download/${encodeURIComponent(yahooSym)}?period1=${period1}&period2=${period2}&interval=1d&events=history`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": STOOQ_UA,
      Accept: "text/csv,text/plain,*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSym)}/history/`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`);

  const text = await res.text();
  const trimmed = text.trim();
  if (trimmed.length < 30 || trimmed.startsWith("<")) {
    throw new Error("No data from Yahoo Finance");
  }

  // CSV: Date,Open,High,Low,Close,Adj Close,Volume
  const lines = trimmed.split("\n");
  const bars: StooqBar[] = [];
  for (let i = 1; i < lines.length; i++) {
    const p = lines[i].split(",");
    if (p.length < 5) continue;
    const close = parseFloat(p[4]);
    if (isNaN(close) || close <= 0) continue;
    const dateParts = p[0].trim().split("-");
    if (dateParts.length !== 3) continue;
    const ts = Date.UTC(+dateParts[0], +dateParts[1] - 1, +dateParts[2]) / 1000;
    bars.push({
      time: ts,
      open: parseFloat(p[1]) || close,
      high: parseFloat(p[2]) || close,
      low: parseFloat(p[3]) || close,
      close,
      volume: parseFloat(p[6] ?? "0") || 0,
    });
  }
  if (!bars.length) throw new Error("No valid bars from Yahoo Finance");
  return bars;
}
