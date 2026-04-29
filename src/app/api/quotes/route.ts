import { NextRequest, NextResponse } from "next/server";
import { fetchLiveQuote, type LiveQuotePayload } from "@/lib/live-quote";

export type QuoteResult = LiveQuotePayload;

export type BatchQuoteResponse = Record<string, QuoteResult>;

/* ── short server-side cache for chart workspace quote polling ── */
const CACHE_TTL = 15 * 1000;
const cache = new Map<string, { data: QuoteResult; ts: number }>();

async function getQuote(symbol: string): Promise<QuoteResult> {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  const result = await fetchLiveQuote(symbol);
  if (result.source === "live") {
    cache.set(symbol, { data: result, ts: Date.now() });
  }
  return result;
}

/**
 * GET /api/quotes?symbols=AAPL,MSFT,NVDA
 * Finnhub when configured; otherwise Stooq → Yahoo (same chain as /api/quote).
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 20);

  if (!symbols.length) return NextResponse.json({}, { status: 400 });

  const results = await Promise.all(symbols.map(getQuote));

  const response: BatchQuoteResponse = {};
  for (const r of results) response[r.symbol] = r;

  return NextResponse.json(response, {
    headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=15" },
  });
}
