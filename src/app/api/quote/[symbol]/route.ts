import { NextRequest, NextResponse } from "next/server";
import { fetchLiveQuote, type LiveQuotePayload } from "@/lib/live-quote";

export type QuoteResult = LiveQuotePayload;

/* ── 30-minute server-side cache ─────────────────────────── */
const CACHE_TTL = 30 * 60 * 1000;
const cache = new Map<string, { data: QuoteResult; ts: number }>();

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

  const result = await fetchLiveQuote(upper);

  if (result.source === "live") {
    cache.set(upper, { data: result, ts: Date.now() });
    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  }

  return NextResponse.json(result, { status: 502 });
}
