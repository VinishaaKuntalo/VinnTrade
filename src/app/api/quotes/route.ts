import { NextRequest, NextResponse } from "next/server";
import {
  fetchQuote,
  isSupportedSymbol,
} from "@/lib/finnhub";

export interface QuoteResult {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;   // percentage
  fetchedAt: string;
  source: "live" | "unavailable";
  error?: string;
}

export type BatchQuoteResponse = Record<string, QuoteResult>;

/* ── 5-minute server-side cache ── */
const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { data: QuoteResult; ts: number }>();

async function getQuote(symbol: string): Promise<QuoteResult> {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  if (!isSupportedSymbol(symbol)) {
    return {
      symbol, price: 0, prevClose: 0, change: 0,
      fetchedAt: new Date().toISOString(),
      source: "unavailable", error: "Not a US-listed symbol",
    };
  }

  try {
    const q = await fetchQuote(symbol);

    // Finnhub returns c=0 for unknown/unsupported symbols
    if (!q.c || q.c === 0) throw new Error("No price returned");

    const result: QuoteResult = {
      symbol,
      price: Math.round(q.c * 100) / 100,
      prevClose: Math.round(q.pc * 100) / 100,
      change: Math.round(q.dp * 100) / 100,
      fetchedAt: new Date().toISOString(),
      source: "live",
    };

    cache.set(symbol, { data: result, ts: Date.now() });
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      symbol, price: 0, prevClose: 0, change: 0,
      fetchedAt: new Date().toISOString(),
      source: "unavailable", error: msg,
    };
  }
}

/**
 * GET /api/quotes?symbols=AAPL,MSFT,NVDA
 * Fetches all symbols in parallel via Finnhub.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 20);

  if (!symbols.length) return NextResponse.json({}, { status: 400 });

  const results = await Promise.all(symbols.map(getQuote));

  const response: BatchQuoteResponse = {};
  for (const r of results) response[r.symbol] = r;

  return NextResponse.json(response, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" },
  });
}
