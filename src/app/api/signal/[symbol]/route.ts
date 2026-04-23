import { NextRequest, NextResponse } from "next/server";
import { scoreTechnicals } from "@/lib/technical-analysis";
import { toYahooSymbol } from "@/lib/yahoo-symbol";

/* ── in-process cache (4 h) ────────────────────────────── */
const CACHE_TTL = 4 * 60 * 60 * 1000;
const cache = new Map<string, { data: RealSignal; ts: number }>();

export interface RealSignal {
  symbol: string;
  yahooSymbol: string;
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

/* ── Yahoo Finance v8 chart API (crumb-authenticated) ──── */
interface YahooBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/* ── session / crumb cache ────────────────────────────── */
let session: { cookie: string; crumb: string; ts: number } | null = null;
const SESSION_TTL = 30 * 60 * 1000; // 30 min

async function getSession(): Promise<{ cookie: string; crumb: string }> {
  if (session && Date.now() - session.ts < SESSION_TTL) return session;

  // 1. visit fc.yahoo.com to pick up consent cookies
  const consentRes = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": UA },
    redirect: "follow",
    cache: "no-store",
  });
  const setCookies = consentRes.headers.getSetCookie?.() ??
    [consentRes.headers.get("set-cookie") ?? ""].filter(Boolean);
  const cookie = setCookies.map((c) => c.split(";")[0]).join("; ");

  // 2. get crumb
  const crumbRes = await fetch(
    "https://query2.finance.yahoo.com/v1/test/getcrumb",
    { headers: { "User-Agent": UA, Cookie: cookie }, cache: "no-store" }
  );
  const crumb = (await crumbRes.text()).trim();
  if (!crumb || crumb.startsWith("{")) throw new Error("Could not obtain Yahoo crumb");

  session = { cookie, crumb, ts: Date.now() };
  return session;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function parseChart(json: unknown): YahooBar[] {
  const j = json as Record<string, unknown>;
  const result = ((j?.chart as Record<string, unknown>)?.result as unknown[]);
  if (!result?.[0]) throw new Error("Empty chart result");
  const r = result[0] as Record<string, unknown>;
  const timestamps = (r.timestamp as number[]) ?? [];
  const q = ((r.indicators as Record<string, unknown>)?.quote as Record<string, unknown>[])?.[0] ?? {};
  const adjClose = (((r.indicators as Record<string, unknown>)?.adjclose as Record<string, unknown>[])?.[0]?.adjclose as number[] | undefined);
  return timestamps
    .map((ts, i) => {
      const close = adjClose ? adjClose[i] : (q.close as number[])?.[i];
      return {
        date: new Date(ts * 1000),
        open: (q.open as number[])?.[i] ?? close,
        high: (q.high as number[])?.[i] ?? close,
        low:  (q.low  as number[])?.[i] ?? close,
        close: close ?? 0,
        volume: (q.volume as number[])?.[i] ?? 0,
      };
    })
    .filter((b) => b.close > 0);
}

async function fetchYahooHistory(ySymbol: string, range = "6mo"): Promise<YahooBar[]> {
  let lastErr: Error = new Error("unknown");

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        session = null; // force crumb refresh on retry
        await sleep(800 * attempt);
      }
      const { cookie, crumb } = await getSession();
      const host = attempt === 1 ? "query1.finance.yahoo.com" : "query2.finance.yahoo.com";
      const url = `https://${host}/v8/finance/chart/${encodeURIComponent(ySymbol)}?interval=1d&range=${range}&crumb=${encodeURIComponent(crumb)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Cookie: cookie },
        cache: "no-store",
      });
      if (res.status === 429) {
        await sleep(2000 * (attempt + 1));
        lastErr = new Error(`Yahoo Finance rate limited (429)`);
        continue;
      }
      if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`);
      const json = await res.json();
      return parseChart(json);
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr;
}

/* ── ATR-based trade setup ─────────────────────────────── */
function buildTrade(price: number, atrVal: number, dir: "BUY" | "SELL" | "HOLD") {
  const atrMult = 2.0;
  const rrRatio = 2.5;

  if (dir === "BUY") {
    return {
      currentPrice: price,
      entry: price,
      stopLoss:    Math.round((price - atrMult * atrVal) * 100) / 100,
      target:      Math.round((price + atrMult * rrRatio * atrVal) * 100) / 100,
      riskReward:  rrRatio,
      atrDaily:    Math.round((atrVal / price) * 1000) / 10,
      maxPosition: Math.min(5, Math.max(0.5, Math.round((1 / (atrMult * (atrVal / price) * 100)) * 200) / 10)),
    };
  }
  if (dir === "SELL") {
    return {
      currentPrice: price,
      entry: price,
      stopLoss:    Math.round((price + atrMult * atrVal) * 100) / 100,
      target:      Math.round((price - atrMult * rrRatio * atrVal) * 100) / 100,
      riskReward:  rrRatio,
      atrDaily:    Math.round((atrVal / price) * 1000) / 10,
      maxPosition: Math.min(5, Math.max(0.5, Math.round((1 / (atrMult * (atrVal / price) * 100)) * 200) / 10)),
    };
  }
  return {
    currentPrice: price,
    entry: price,
    stopLoss:    Math.round((price - atrVal) * 100) / 100,
    target:      Math.round((price + atrVal) * 100) / 100,
    riskReward:  1.0,
    atrDaily:    Math.round((atrVal / price) * 1000) / 10,
    maxPosition: 2.0,
  };
}

/* ── main fetch + score ────────────────────────────────── */
async function fetchAndScore(symbol: string): Promise<RealSignal> {
  const ySymbol = toYahooSymbol(symbol);
  const bars = await fetchYahooHistory(ySymbol, "6mo");

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
    yahooSymbol: ySymbol,
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

/* ── Route handler ─────────────────────────────────────── */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();

  // serve from in-process cache
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
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "public, max-age=14400",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isRateLimit = msg.toLowerCase().includes("429") || msg.toLowerCase().includes("rate limit");
    // Return 503 for rate-limits so the client can retry gracefully
    return NextResponse.json(
      {
        symbol: upper,
        error: msg,
        retryAfterSeconds: isRateLimit ? 60 : 0,
        fetchedAt: new Date().toISOString(),
      },
      { status: isRateLimit ? 503 : 502 }
    );
  }
}
