import { NextRequest, NextResponse } from "next/server";
import { toStooqSymbol } from "@/lib/stooq-symbol";

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

const SKIP_PATTERN = /\.\w{2,3}$|^\d{4,}/;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

async function fetchBars(symbol: string): Promise<ChartResponse> {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  if (SKIP_PATTERN.test(symbol)) {
    return { symbol, bars: [], source: "unavailable", fetchedAt: new Date().toISOString(), error: "Not on Stooq" };
  }

  try {
    const stooqSym = toStooqSymbol(symbol);

    // 9 months of history gives enough bars for EMA-50, MACD-26, etc.
    const d2 = new Date();
    const d1 = new Date(d2.getTime() - 270 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

    const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSym)}&d1=${fmt(d1)}&d2=${fmt(d2)}&i=d`;

    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/csv,*/*" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    if (text.trim().toLowerCase().startsWith("no data") || text.trim().length < 30) {
      throw new Error("No data on Stooq");
    }

    const lines = text.trim().split("\n");
    const bars: OhlcvBar[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length < 5) continue;
      const [dateStr, openStr, highStr, lowStr, closeStr, volStr] = parts;

      const dateParts = dateStr.trim().split("-");
      if (dateParts.length !== 3) continue;
      const ts = Date.UTC(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2])
      ) / 1000;

      const open  = parseFloat(openStr);
      const high  = parseFloat(highStr);
      const low   = parseFloat(lowStr);
      const close = parseFloat(closeStr);
      const volume = parseFloat(volStr ?? "0") || 0;

      if (isNaN(close) || close <= 0) continue;
      bars.push({ time: ts, open: open || close, high: high || close, low: low || close, close, volume });
    }

    // Stooq returns newest-first → reverse to chronological
    bars.reverse();

    if (bars.length === 0) throw new Error("No valid bars");

    const result: ChartResponse = {
      symbol,
      bars,
      source: `Stooq · ${stooqSym} · ${bars.length} bars`,
      fetchedAt: new Date().toISOString(),
    };

    cache.set(symbol, { data: result, ts: Date.now() });
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { symbol, bars: [], source: "unavailable", fetchedAt: new Date().toISOString(), error: msg };
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  const data = await fetchBars(upper);

  if (data.error && data.bars.length === 0) {
    return NextResponse.json(data, { status: 502 });
  }
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=14400" },
  });
}
