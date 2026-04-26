import { NextRequest, NextResponse } from "next/server";
import { toStooqSymbol } from "@/lib/stooq-symbol";

export interface QuoteResult {
  symbol: string;
  price: number;
  prevClose: number;
  change: number; // percentage
  fetchedAt: string;
  source: "live" | "unavailable";
  error?: string;
}

/* ── 30-minute server-side cache ─────────────────────────── */
const CACHE_TTL = 30 * 60 * 1000;
const cache = new Map<string, { data: QuoteResult; ts: number }>();

/* ── Symbols that are not on US-accessible Stooq ────────── */
const SKIP_PATTERN = /\.\w{2,3}$|^\d{4,}/; // e.g. 034220.KS, 2222.SR, NPN

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

interface Bar {
  date: Date;
  close: number;
}

async function fetchLastTwoBars(stooqSym: string): Promise<Bar[]> {
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSym)}&i=d`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/csv,*/*" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Stooq HTTP ${res.status}`);

  const text = await res.text();
  if (text.trim().toLowerCase().startsWith("no data") || text.trim().length < 30) {
    throw new Error("No data on Stooq");
  }

  const lines = text.trim().split("\n");
  // Last 5 trading days max — newest last after Stooq reversal
  const rows: Bar[] = [];
  for (let i = Math.max(1, lines.length - 10); i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < 5) continue;
    const close = parseFloat(parts[4]);
    if (isNaN(close) || close <= 0) continue;
    rows.push({ date: new Date(parts[0].trim()), close });
  }
  // Stooq returns newest-first, reverse to chronological
  rows.reverse();
  return rows;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();

  const cached = cache.get(upper);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data, { headers: { "X-Cache": "HIT" } });
  }

  // Non-Stooq symbols — return unavailable immediately
  if (SKIP_PATTERN.test(upper)) {
    const result: QuoteResult = {
      symbol: upper,
      price: 0,
      prevClose: 0,
      change: 0,
      fetchedAt: new Date().toISOString(),
      source: "unavailable",
      error: "Symbol not available on Stooq",
    };
    return NextResponse.json(result);
  }

  try {
    const stooqSym = toStooqSymbol(upper);
    const bars = await fetchLastTwoBars(stooqSym);

    if (bars.length < 2) throw new Error(`Only ${bars.length} bars`);

    const price = bars[bars.length - 1].close;
    const prevClose = bars[bars.length - 2].close;
    const change = ((price - prevClose) / prevClose) * 100;

    const result: QuoteResult = {
      symbol: upper,
      price: Math.round(price * 100) / 100,
      prevClose: Math.round(prevClose * 100) / 100,
      change: Math.round(change * 100) / 100,
      fetchedAt: new Date().toISOString(),
      source: "live",
    };

    cache.set(upper, { data: result, ts: Date.now() });
    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const result: QuoteResult = {
      symbol: upper,
      price: 0,
      prevClose: 0,
      change: 0,
      fetchedAt: new Date().toISOString(),
      source: "unavailable",
      error: msg,
    };
    return NextResponse.json(result, { status: 502 });
  }
}
