import { NextRequest, NextResponse } from "next/server";
import { buildFallbackCandles, fetchCandles, fetchStooqCandles, fetchYahooCandles, daysAgoSecs, nowSecs } from "@/lib/finnhub";

export interface OhlcvBar {
  time: number;   // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartResponse {
  symbol: string;
  bars: OhlcvBar[];
  source: string;
  fetchedAt: string;
  error?: string;
}

/* ── 4-hour server cache ── */
const CACHE_TTL = 4 * 60 * 60 * 1000;
const cache = new Map<string, { data: ChartResponse; ts: number }>();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  const daysParam = Number(req.nextUrl.searchParams.get("days") ?? "270");
  const days = Number.isFinite(daysParam) ? Math.min(730, Math.max(30, Math.round(daysParam))) : 270;
  const anchorParam = Number(req.nextUrl.searchParams.get("anchor") ?? "");
  const anchorPrice = Number.isFinite(anchorParam) && anchorParam > 0 ? anchorParam : undefined;
  const cacheKey = `${upper}:${days}:${anchorPrice ?? "none"}`;

  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    return NextResponse.json(hit.data, { headers: { "X-Cache": "HIT" } });
  }

  let bars: OhlcvBar[] = [];
  let source = "";

  // Try Finnhub first; fall back to Stooq if it fails
  try {
    const from = daysAgoSecs(days);
    const to   = nowSecs();
    const candles = await fetchCandles(upper, from, to);
    if (candles.s !== "ok" || !candles.t?.length) throw new Error("no_data");
    bars = candles.t.map((t, i) => ({
      time: t, open: candles.o[i], high: candles.h[i],
      low: candles.l[i], close: candles.c[i], volume: candles.v[i],
    }));
    source = `Finnhub · ${bars.length} bars`;
  } catch {
    try {
      const stooq = await fetchStooqCandles(upper, days);
      bars = stooq;
      source = `Stooq · ${bars.length} bars`;
    } catch {
      try {
        const yahoo = await fetchYahooCandles(upper, days);
        bars = yahoo;
        source = `Yahoo Finance · ${bars.length} bars`;
      } catch {
        bars = buildFallbackCandles(upper, days, anchorPrice);
        source = anchorPrice
          ? `Fallback model · ${bars.length} bars · scaled to live ~${anchorPrice}`
          : `Fallback model · ${bars.length} bars`;
      }
    }
  }

  const result: ChartResponse = {
    symbol: upper, bars, source, fetchedAt: new Date().toISOString(),
  };
  cache.set(cacheKey, { data: result, ts: Date.now() });
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=14400", "X-Cache": "MISS" },
  });
}
