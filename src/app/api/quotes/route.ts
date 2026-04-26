import { NextRequest, NextResponse } from "next/server";
import { toStooqSymbol } from "@/lib/stooq-symbol";

export interface QuoteResult {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  fetchedAt: string;
  source: "live" | "unavailable";
  error?: string;
}

export type BatchQuoteResponse = Record<string, QuoteResult>;

/* ── 30-minute server-side cache (shared across all requests) ── */
const CACHE_TTL = 30 * 60 * 1000;
const cache = new Map<string, { data: QuoteResult; ts: number }>();

/* ── Symbols not available on US-accessible Stooq ── */
const SKIP_PATTERN = /\.\w{2,3}$|^\d{4,}/;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

async function fetchQuote(symbol: string): Promise<QuoteResult> {
  const now = Date.now();

  // Cache hit
  const hit = cache.get(symbol);
  if (hit && now - hit.ts < CACHE_TTL) return hit.data;

  // Non-Stooq symbols — skip immediately
  if (SKIP_PATTERN.test(symbol)) {
    return { symbol, price: 0, prevClose: 0, change: 0, fetchedAt: new Date().toISOString(), source: "unavailable", error: "Not on Stooq" };
  }

  try {
    const stooqSym = toStooqSymbol(symbol);
    // Request only the last 10 calendar days — tiny CSV, much faster response
    const d2 = new Date();
    const d1 = new Date(d2.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSym)}&d1=${fmt(d1)}&d2=${fmt(d2)}&i=d`;

    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/csv,*/*" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    if (text.trim().toLowerCase().startsWith("no data") || text.trim().length < 30) {
      throw new Error("No data");
    }

    const lines = text.trim().split("\n");
    const closes: number[] = [];

    // Stooq newest-first — read last 5 data rows, collect up to 2 valid closes
    for (let i = Math.max(1, lines.length - 8); i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length < 5) continue;
      const c = parseFloat(parts[4]);
      if (!isNaN(c) && c > 0) closes.push(c);
    }
    // Reverse to chronological (oldest first)
    closes.reverse();

    if (closes.length < 2) throw new Error("Not enough bars");

    const price = closes[closes.length - 1];
    const prevClose = closes[closes.length - 2];
    const change = Math.round(((price - prevClose) / prevClose) * 10000) / 100;

    const result: QuoteResult = {
      symbol,
      price: Math.round(price * 100) / 100,
      prevClose: Math.round(prevClose * 100) / 100,
      change,
      fetchedAt: new Date().toISOString(),
      source: "live",
    };

    cache.set(symbol, { data: result, ts: now });
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { symbol, price: 0, prevClose: 0, change: 0, fetchedAt: new Date().toISOString(), source: "unavailable", error: msg };
  }
}

/**
 * GET /api/quotes?symbols=AAPL,MSFT,NVDA
 * Fetches all requested symbols in parallel on the server.
 * Returns a map of { [SYMBOL]: QuoteResult }.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 20); // hard cap

  if (!symbols.length) {
    return NextResponse.json({}, { status: 400 });
  }

  const results = await Promise.all(symbols.map(fetchQuote));

  const response: BatchQuoteResponse = {};
  for (const r of results) response[r.symbol] = r;

  // How many were live (not from cache)?
  const allCached = results.every(
    (r) => r.source === "unavailable" || (cache.get(r.symbol)?.ts ?? 0) < Date.now() - 1000
  );

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, max-age=1800, stale-while-revalidate=300",
      "X-Cache": allCached ? "HIT" : "MISS",
    },
  });
}
