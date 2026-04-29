import { NextRequest, NextResponse } from "next/server";
import { scoreTechnicals } from "@/lib/technical-analysis";
import { buildFallbackCandles, fetchCandles, fetchStooqCandles, fetchYahooCandles, daysAgoSecs, nowSecs } from "@/lib/finnhub";

/* ── In-process cache (4 h) ─────────────────────────────── */
const CACHE_TTL = 4 * 60 * 60 * 1000;
const cache = new Map<string, { data: RealSignal; ts: number }>();

export interface RealSignal {
  symbol: string;
  dataSource: string;
  currentPrice: number;
  direction: "BUY" | "SELL" | "HOLD";
  confidence: number;
  bullStrength: number;
  bearStrength: number;
  rsi: number;
  macdHistogram: number;
  ema20: number;
  ema50: number;
  atr: number;
  momentumRoc: number;
  indicatorVotes: { label: string; vote: string; weight: number }[];
  // Extended indicators
  rs: number;
  alphaScore: number;
  betaScore: number;
  gammaScore: number;
  thetaScore: number;
  stochK: number;
  wR: number;
  trade: {
    currentPrice: number;
    entry: number;
    stopLoss: number;
    target: number;
    riskReward: number;
    atrDaily: number;
    maxPosition: number;
  };
  dataPoints: number;
  fetchedAt: string;
  error?: string;
}

/* ── In-flight deduplication ─────────────────────────────── */
interface Bar { open: number; high: number; low: number; close: number; volume: number; }
const inFlight = new Map<string, Promise<{ bars: Bar[]; source: string }>>();

function fetchWithDedup(symbol: string, anchorPrice?: number): Promise<{ bars: Bar[]; source: string }> {
  const dedupeKey = `${symbol}:${anchorPrice ?? ""}`;
  const existing = inFlight.get(dedupeKey);
  if (existing) return existing;
  const promise = fetchBars(symbol, anchorPrice).finally(() => inFlight.delete(dedupeKey));
  inFlight.set(dedupeKey, promise);
  return promise;
}

async function fetchBars(symbol: string, anchorPrice?: number): Promise<{ bars: Bar[]; source: string }> {
  // Try Finnhub first; fall back to Stooq
  try {
    const from = daysAgoSecs(270);
    const to   = nowSecs();
    const candles = await fetchCandles(symbol, from, to);
    if (candles.s !== "ok" || !candles.t?.length) throw new Error("no_data");
    return {
      bars: candles.t.map((_, i) => ({
        open: candles.o[i], high: candles.h[i],
        low: candles.l[i], close: candles.c[i], volume: candles.v[i],
      })),
      source: "Finnhub",
    };
  } catch {
    try {
      const stooq = await fetchStooqCandles(symbol, 270);
      return {
        bars: stooq.map((b) => ({
          open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume,
        })),
        source: "Stooq",
      };
    } catch {
      let yahoo;
      let source = "Yahoo Finance";
      try {
        yahoo = await fetchYahooCandles(symbol, 270);
      } catch {
        yahoo = buildFallbackCandles(symbol, 270, anchorPrice);
        source = anchorPrice ? "Fallback model (anchored to live quote)" : "Fallback model";
      }
      return {
        bars: yahoo.map((b) => ({
          open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume,
        })),
        source,
      };
    }
  }
}

/* ── ATR-based trade setup ───────────────────────────────── */
function buildTrade(price: number, atrVal: number, dir: "BUY" | "SELL" | "HOLD") {
  const atrMult = 2.0;
  const rrRatio = 2.5;

  if (dir === "BUY") {
    return {
      currentPrice: price,
      entry: price,
      stopLoss:  Math.round((price - atrMult * atrVal) * 100) / 100,
      target:    Math.round((price + atrMult * rrRatio * atrVal) * 100) / 100,
      riskReward: rrRatio,
      atrDaily:  Math.round((atrVal / price) * 1000) / 10,
      maxPosition: Math.min(5, Math.max(0.5, Math.round((1 / (atrMult * (atrVal / price) * 100)) * 200) / 10)),
    };
  }
  if (dir === "SELL") {
    return {
      currentPrice: price,
      entry: price,
      stopLoss:  Math.round((price + atrMult * atrVal) * 100) / 100,
      target:    Math.round((price - atrMult * rrRatio * atrVal) * 100) / 100,
      riskReward: rrRatio,
      atrDaily:  Math.round((atrVal / price) * 1000) / 10,
      maxPosition: Math.min(5, Math.max(0.5, Math.round((1 / (atrMult * (atrVal / price) * 100)) * 200) / 10)),
    };
  }
  return {
    currentPrice: price,
    entry: price,
    stopLoss:  Math.round((price - atrVal) * 100) / 100,
    target:    Math.round((price + atrVal) * 100) / 100,
    riskReward: 1.0,
    atrDaily:  Math.round((atrVal / price) * 1000) / 10,
    maxPosition: 2.0,
  };
}

/* ── Main fetch + score ──────────────────────────────────── */
async function fetchAndScore(symbol: string, anchorPrice?: number): Promise<RealSignal> {
  const { bars, source } = await fetchWithDedup(symbol, anchorPrice);

  if (bars.length < 30) {
    throw new Error(`Only ${bars.length} bars for ${symbol} — need ≥ 30`);
  }

  const closes  = bars.map((b) => b.close);
  const highs   = bars.map((b) => b.high);
  const lows    = bars.map((b) => b.low);
  const volumes = bars.map((b) => b.volume);

  const tech  = scoreTechnicals(closes, highs, lows, volumes);
  const trade = buildTrade(tech.currentPrice, tech.atrValue, tech.direction);

  return {
    symbol,
    dataSource:    `${source} · ${bars.length} bars`,
    currentPrice:  tech.currentPrice,
    direction:     tech.direction,
    confidence:    tech.confidence,
    bullStrength:  tech.bullStrength,
    bearStrength:  tech.bearStrength,
    rsi:           tech.rsiValue,
    macdHistogram: tech.macdHistogram,
    ema20:         tech.ema20,
    ema50:         tech.ema50,
    atr:           tech.atrValue,
    momentumRoc:   tech.momentumRoc,
    indicatorVotes: tech.indicatorVotes,
    rs:            tech.rs,
    alphaScore:    tech.alphaScore,
    betaScore:     tech.betaScore,
    gammaScore:    tech.gammaScore,
    thetaScore:    tech.thetaScore,
    stochK:        tech.stochK,
    wR:            tech.wR,
    trade,
    dataPoints:    bars.length,
    fetchedAt:     new Date().toISOString(),
  };
}

/* ── Route handler ───────────────────────────────────────── */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  const anchorParam = Number(req.nextUrl.searchParams.get("anchor") ?? "");
  const anchorPrice =
    Number.isFinite(anchorParam) && anchorParam > 0 ? anchorParam : undefined;
  const cacheKey = `${upper}:${anchorPrice ?? "none"}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: {
        "X-Cache": "HIT",
        "X-Cached-At": new Date(cached.ts).toISOString(),
        "Cache-Control": "public, max-age=14400",
      },
    });
  }

  try {
    const data = await fetchAndScore(upper, anchorPrice);
    cache.set(cacheKey, { data, ts: Date.now() });
    return NextResponse.json(data, {
      headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=14400" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { symbol: upper, error: msg, fetchedAt: new Date().toISOString() },
      { status: 502 }
    );
  }
}
