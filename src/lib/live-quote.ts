/**
 * Live quote: Finnhub when configured, else Stooq → Yahoo → synthetic bars (same as /api/quote).
 */

import { toStooqSymbol } from "@/lib/stooq-symbol";
import { buildFallbackCandles, fetchQuoteOptional, fetchYahooCandles } from "@/lib/finnhub";
import { instrumentCurrency } from "@/lib/instrument-currency";

export interface LiveQuotePayload {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  fetchedAt: string;
  source: "live" | "unavailable";
  currency: string;
  error?: string;
}

const SKIP_PATTERN = /\.\w{2,3}$|^\d{4,}/;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

interface Bar {
  date: Date;
  close: number;
}

async function fetchLastTwoBarsStooq(stooqSym: string): Promise<Bar[]> {
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSym)}&i=d`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/csv,*/*" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Stooq HTTP ${res.status}`);

  const text = await res.text();
  const trimmed = text.trim();
  if (trimmed.length < 30 || trimmed.toLowerCase().startsWith("no data")) {
    throw new Error("No data on Stooq");
  }
  if (trimmed.startsWith("<") || trimmed.toLowerCase().includes("<!doctype")) {
    throw new Error("Stooq rate limited");
  }

  const lines = trimmed.split("\n");
  const rows: Bar[] = [];
  for (let i = Math.max(1, lines.length - 10); i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < 5) continue;
    const close = parseFloat(parts[4]);
    if (isNaN(close) || close <= 0) continue;
    rows.push({ date: new Date(parts[0].trim()), close });
  }
  rows.reverse();
  return rows;
}

function unavailable(symbol: string, error: string): LiveQuotePayload {
  return {
    symbol,
    price: 0,
    prevClose: 0,
    change: 0,
    fetchedAt: new Date().toISOString(),
    source: "unavailable",
    currency: instrumentCurrency(symbol),
    error,
  };
}

/**
 * Best-effort last price + daily % change (vs previous close proxy from last bar).
 */
export async function fetchLiveQuote(symbol: string): Promise<LiveQuotePayload> {
  const upper = symbol.toUpperCase();
  const currency = instrumentCurrency(upper);

  if (SKIP_PATTERN.test(upper)) {
    return unavailable(upper, "Symbol pattern not supported for free quote providers");
  }

  const fh = await fetchQuoteOptional(upper);
  if (fh && fh.c > 0) {
    const prevClose =
      fh.pc > 0
        ? Math.round(fh.pc * 100) / 100
        : Math.round((fh.c - (fh.d ?? 0)) * 100) / 100;
    const change =
      prevClose > 0
        ? Math.round(((fh.c - prevClose) / prevClose) * 100 * 100) / 100
        : Math.round((fh.dp ?? 0) * 100) / 100;
    return {
      symbol: upper,
      price: Math.round(fh.c * 100) / 100,
      prevClose,
      change,
      fetchedAt: new Date().toISOString(),
      source: "live",
      currency,
    };
  }

  try {
    let price: number;
    let prevClose: number;

    try {
      const stooqSym = toStooqSymbol(upper);
      const bars = await fetchLastTwoBarsStooq(stooqSym);
      if (bars.length < 2) throw new Error(`Only ${bars.length} bars`);
      price = bars[bars.length - 1].close;
      prevClose = bars[bars.length - 2].close;
    } catch {
      let yahooBars;
      try {
        yahooBars = await fetchYahooCandles(upper, 10);
      } catch {
        yahooBars = buildFallbackCandles(upper, 10);
      }
      if (yahooBars.length < 2) throw new Error(`Only ${yahooBars.length} bars available`);
      price = yahooBars[yahooBars.length - 1].close;
      prevClose = yahooBars[yahooBars.length - 2].close;
    }

    const change = ((price - prevClose) / prevClose) * 100;

    return {
      symbol: upper,
      price: Math.round(price * 100) / 100,
      prevClose: Math.round(prevClose * 100) / 100,
      change: Math.round(change * 100) / 100,
      fetchedAt: new Date().toISOString(),
      source: "live",
      currency,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return unavailable(upper, msg);
  }
}
