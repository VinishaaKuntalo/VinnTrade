import { NextRequest, NextResponse } from "next/server";
import { fetchCandles, isSupportedSymbol, daysAgoSecs, nowSecs } from "@/lib/finnhub";

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
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();

  const hit = cache.get(upper);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    return NextResponse.json(hit.data, { headers: { "X-Cache": "HIT" } });
  }

  if (!isSupportedSymbol(upper)) {
    return NextResponse.json(
      { symbol: upper, bars: [], source: "unavailable", fetchedAt: new Date().toISOString(), error: "Not a US-listed symbol" },
      { status: 502 }
    );
  }

  try {
    // 9 months of daily bars
    const from = daysAgoSecs(270);
    const to   = nowSecs();
    const candles = await fetchCandles(upper, from, to);

    if (candles.s !== "ok" || !candles.t?.length) {
      throw new Error("No candle data returned");
    }

    const bars: OhlcvBar[] = candles.t.map((t, i) => ({
      time:   t,
      open:   candles.o[i],
      high:   candles.h[i],
      low:    candles.l[i],
      close:  candles.c[i],
      volume: candles.v[i],
    }));

    const result: ChartResponse = {
      symbol: upper,
      bars,
      source: `Finnhub · ${bars.length} bars`,
      fetchedAt: new Date().toISOString(),
    };

    cache.set(upper, { data: result, ts: Date.now() });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=14400", "X-Cache": "MISS" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { symbol: upper, bars: [], source: "unavailable", fetchedAt: new Date().toISOString(), error: msg },
      { status: 502 }
    );
  }
}
