import { NextRequest, NextResponse } from "next/server";
import { quoteSingleRouteCacheMs } from "@/lib/api-cache-config";
import { fetchLiveQuote, type LiveQuotePayload } from "@/lib/live-quote";

export type QuoteResult = LiveQuotePayload;

/* ── Quote cache (batch route uses its own short TTL) ─────── */
const CACHE_TTL = quoteSingleRouteCacheMs;
const cache = new Map<string, { data: QuoteResult; ts: number }>();

function cacheHeaders(hit: boolean): Record<string, string> {
  const maxAge = Math.max(1, Math.floor(CACHE_TTL / 1000));
  return {
    "X-Cache": hit ? "HIT" : "MISS",
    "Cache-Control": `public, max-age=${maxAge}, stale-while-revalidate=${maxAge}`,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();

  const cached = cache.get(upper);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data, { headers: cacheHeaders(true) });
  }

  const result = await fetchLiveQuote(upper);

  if (result.source === "live") {
    cache.set(upper, { data: result, ts: Date.now() });
    return NextResponse.json(result, { headers: cacheHeaders(false) });
  }

  return NextResponse.json(result, { status: 502 });
}
