/**
 * Server route cache windows for market data. Tune via env to balance Finnhub limits vs freshness.
 * Daily OHLCV does not change tick-by-tick; quotes use `/api/quotes` (15s) for faster marks.
 */

function parseMs(envKey: string, fallback: number): number {
  const raw = process.env[envKey];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Chart `/api/chart/[symbol]` full-series cache */
export const chartRouteCacheMs = parseMs("VINNTRADE_CHART_CACHE_MS", 90_000);

/** Technical signal `/api/signal/[symbol]` cache */
export const signalRouteCacheMs = parseMs("VINNTRADE_SIGNAL_CACHE_MS", 45_000);

/** `/api/quote/[symbol]` single-symbol quote cache (batch route keeps its own 15s TTL) */
export const quoteSingleRouteCacheMs = parseMs("VINNTRADE_QUOTE_CACHE_MS", 60_000);
