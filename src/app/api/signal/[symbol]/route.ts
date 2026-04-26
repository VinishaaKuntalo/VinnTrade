import { NextRequest, NextResponse } from "next/server";
import { scoreTechnicals } from "@/lib/technical-analysis";
import { toStooqSymbol } from "@/lib/stooq-symbol";

/* ── in-process cache (4 h) ─────────────────────────────── */
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

/* ── Bar type ────────────────────────────────────────────── */
interface Bar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/* ── In-flight deduplication ─────────────────────────────── */
const inFlight = new Map<string, Promise<Bar[]>>();

function fetchWithDedup(stooqSymbol: string): Promise<Bar[]> {
  const existing = inFlight.get(stooqSymbol);
  if (existing) return existing;

  const promise = fetchStooqHistory(stooqSymbol).finally(() => {
    inFlight.delete(stooqSymbol);
  });

  inFlight.set(stooqSymbol, promise);
  return promise;
}

/* ── Stooq CSV fetch ─────────────────────────────────────── */
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Stooq returns daily OHLCV as CSV.
 * URL:  https://stooq.com/q/d/l/?s={symbol}&i=d
 * CSV:  Date,Open,High,Low,Close,Volume
 *
 * No API key, no crumb, no session — much more reliable than Yahoo Finance.
 */
async function fetchStooqHistory(stooqSymbol: string): Promise<Bar[]> {
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol)}&i=d`;

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/csv,text/plain,*/*" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Stooq HTTP ${res.status} for ${stooqSymbol}`);

  const text = await res.text();

  // Stooq returns "No data" (literally) when a symbol isn't found
  if (text.trim().toLowerCase().startsWith("no data") || text.trim().length < 30) {
    throw new Error(`No data available on Stooq for ${stooqSymbol}`);
  }

  const lines = text.trim().split("\n");
  if (lines.length < 2) throw new Error(`Empty response from Stooq for ${stooqSymbol}`);

  // Filter to last 6 months
  const cutoff = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;

  const bars: Bar[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < 5) continue;
    const [dateStr, openStr, highStr, lowStr, closeStr, volStr] = parts;
    const date = new Date(dateStr.trim());
    const close = parseFloat(closeStr);
    if (!date || isNaN(date.getTime()) || isNaN(close) || close <= 0) continue;
    if (date.getTime() < cutoff) continue;
    bars.push({
      date,
      open: parseFloat(openStr) || close,
      high: parseFloat(highStr) || close,
      low: parseFloat(lowStr) || close,
      close,
      volume: parseFloat(volStr ?? "0") || 0,
    });
  }

  // Stooq returns newest-first — reverse to chronological order
  bars.reverse();

  if (bars.length === 0) throw new Error(`No recent bars from Stooq for ${stooqSymbol}`);
  return bars;
}

/* ── ATR-based trade setup ───────────────────────────────── */
function buildTrade(price: number, atrVal: number, dir: "BUY" | "SELL" | "HOLD") {
  const atrMult = 2.0;
  const rrRatio = 2.5;

  if (dir === "BUY") {
    return {
      currentPrice: price,
      entry: price,
      stopLoss: Math.round((price - atrMult * atrVal) * 100) / 100,
      target: Math.round((price + atrMult * rrRatio * atrVal) * 100) / 100,
      riskReward: rrRatio,
      atrDaily: Math.round((atrVal / price) * 1000) / 10,
      maxPosition: Math.min(
        5,
        Math.max(0.5, Math.round((1 / (atrMult * (atrVal / price) * 100)) * 200) / 10)
      ),
    };
  }
  if (dir === "SELL") {
    return {
      currentPrice: price,
      entry: price,
      stopLoss: Math.round((price + atrMult * atrVal) * 100) / 100,
      target: Math.round((price - atrMult * rrRatio * atrVal) * 100) / 100,
      riskReward: rrRatio,
      atrDaily: Math.round((atrVal / price) * 1000) / 10,
      maxPosition: Math.min(
        5,
        Math.max(0.5, Math.round((1 / (atrMult * (atrVal / price) * 100)) * 200) / 10)
      ),
    };
  }
  return {
    currentPrice: price,
    entry: price,
    stopLoss: Math.round((price - atrVal) * 100) / 100,
    target: Math.round((price + atrVal) * 100) / 100,
    riskReward: 1.0,
    atrDaily: Math.round((atrVal / price) * 1000) / 10,
    maxPosition: 2.0,
  };
}

/* ── main fetch + score ──────────────────────────────────── */
async function fetchAndScore(symbol: string): Promise<RealSignal> {
  const stooqSymbol = toStooqSymbol(symbol);
  const bars = await fetchWithDedup(stooqSymbol);

  if (bars.length < 30) {
    throw new Error(`Only ${bars.length} bars for ${symbol} — need ≥ 30`);
  }

  const closes = bars.map((b) => b.close);
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const volumes = bars.map((b) => b.volume);

  const tech = scoreTechnicals(closes, highs, lows, volumes);
  const trade = buildTrade(tech.currentPrice, tech.atrValue, tech.direction);

  return {
    symbol,
    dataSource: `Stooq · ${stooqSymbol} · ${bars.length} bars`,
    currentPrice: tech.currentPrice,
    direction: tech.direction,
    confidence: tech.confidence,
    uncertainty: tech.uncertainty,
    bullStrength: tech.bullStrength,
    bearStrength: tech.bearStrength,
    rsi: tech.rsiValue,
    macdHistogram: tech.macdHistogram,
    ema20: tech.ema20,
    ema50: tech.ema50,
    atr: tech.atrValue,
    momentumRoc: tech.momentumRoc,
    indicatorVotes: tech.indicatorVotes,
    trade,
    dataPoints: bars.length,
    fetchedAt: new Date().toISOString(),
  };
}

/* ── Route handler ───────────────────────────────────────── */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();

  // Serve from cache first — no external call at all
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
