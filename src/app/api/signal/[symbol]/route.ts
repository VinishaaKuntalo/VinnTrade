import { NextRequest, NextResponse } from "next/server";
import { scoreTechnicals } from "@/lib/technical-analysis";
import { fetchCandles, isSupportedSymbol, daysAgoSecs, nowSecs } from "@/lib/finnhub";

/* ── In-process cache (4 h) ─────────────────────────────── */
const CACHE_TTL = 4 * 60 * 60 * 1000;
const cache = new Map<string, { data: RealSignal; ts: number }>();

export interface RealSignal {
  symbol: string;
  dataSource: string;
  currentPrice: number;
  direction: "BUY" | "SELL" | "HOLD";
  confidence: number;
  uncertainty: number;
  bullStrength: number;
  bearStrength: number;
  rsi: number;
  macdHistogram: number;
  ema20: number;
  ema50: number;
  atr: number;
  momentumRoc: number;
  indicatorVotes: { label: string; vote: string; weight: number }[];
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
const inFlight = new Map<string, Promise<Bar[]>>();

function fetchWithDedup(symbol: string): Promise<Bar[]> {
  const existing = inFlight.get(symbol);
  if (existing) return existing;
  const promise = fetchBars(symbol).finally(() => inFlight.delete(symbol));
  inFlight.set(symbol, promise);
  return promise;
}

async function fetchBars(symbol: string): Promise<Bar[]> {
  const from = daysAgoSecs(270); // 9 months — enough for EMA-50, MACD-26, etc.
  const to   = nowSecs();
  const candles = await fetchCandles(symbol, from, to);

  if (candles.s !== "ok" || !candles.t?.length) {
    throw new Error(`No candle data from Finnhub for ${symbol}`);
  }

  return candles.t.map((_, i) => ({
    open:   candles.o[i],
    high:   candles.h[i],
    low:    candles.l[i],
    close:  candles.c[i],
    volume: candles.v[i],
  }));
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
async function fetchAndScore(symbol: string): Promise<RealSignal> {
  const bars = await fetchWithDedup(symbol);

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
    dataSource: `Finnhub · ${bars.length} bars`,
    currentPrice: tech.currentPrice,
    direction:    tech.direction,
    confidence:   tech.confidence,
    uncertainty:  tech.uncertainty,
    bullStrength: tech.bullStrength,
    bearStrength: tech.bearStrength,
    rsi:          tech.rsiValue,
    macdHistogram: tech.macdHistogram,
    ema20:        tech.ema20,
    ema50:        tech.ema50,
    atr:          tech.atrValue,
    momentumRoc:  tech.momentumRoc,
    indicatorVotes: tech.indicatorVotes,
    trade,
    dataPoints:   bars.length,
    fetchedAt:    new Date().toISOString(),
  };
}

/* ── Route handler ───────────────────────────────────────── */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();

  const cached = cache.get(upper);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: {
        "X-Cache": "HIT",
        "X-Cached-At": new Date(cached.ts).toISOString(),
        "Cache-Control": "public, max-age=14400",
      },
    });
  }

  if (!isSupportedSymbol(upper)) {
    return NextResponse.json(
      { symbol: upper, error: "Symbol not supported", fetchedAt: new Date().toISOString() },
      { status: 400 }
    );
  }

  try {
    const data = await fetchAndScore(upper);
    cache.set(upper, { data, ts: Date.now() });
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
