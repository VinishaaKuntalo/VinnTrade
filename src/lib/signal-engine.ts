/**
 * Deterministic signal engine — educational demo only.
 * BUY/SELL/HOLD signals are seeded from symbol + sector; NOT real trading signals.
 */
import type {
  Direction,
  GeoSensitivity,
  StockSignal,
  TriggeringEvent,
  Volatility,
  Timeframe,
} from "@/types/signals";
import type { StockConstituent } from "@/types/stocks";

/* ── seeded RNG ──────────────────────────────────────────────── */
function h32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (Math.imul(h, 0x01000193) >>> 0);
  }
  return (h >>> 0) / 4_294_967_296;
}

function clamp(v: number, lo = 0, hi = 100) {
  return Math.min(hi, Math.max(lo, Math.round(v)));
}

/* ── sector → typical price ranges ──────────────────────────── */
const PRICE_RANGE: Record<string, [number, number]> = {
  "Information Technology": [80, 680],
  "Health Care":            [45, 320],
  "Financials":             [30, 220],
  "Consumer Discretionary": [40, 420],
  "Consumer Staples":       [35, 180],
  "Energy":                 [20, 140],
  "Materials":              [30, 190],
  "Industrials":            [45, 380],
  "Utilities":              [22, 90],
  "Real Estate":            [18, 130],
  "Communication Services": [30, 260],
};

function priceFor(sector: string, seed: number): number {
  const [lo, hi] = PRICE_RANGE[sector] ?? [20, 300];
  const raw = lo + seed * (hi - lo);
  return Math.round(raw * 100) / 100;
}

/* ── geo triggers per sector ─────────────────────────────────── */
const SECTOR_TRIGGERS: Record<string, { geo: GeoSensitivity; headlines: string[] }> = {
  "Energy": {
    geo: "energy_supply",
    headlines: [
      "Strait of Hormuz naval patrol intensified",
      "OPEC+ emergency output cut discussion leaked",
      "Red Sea rerouting adds 12 days to LNG delivery",
      "Russian pipeline maintenance extended indefinitely",
    ],
  },
  "Information Technology": {
    geo: "trade_restrictions",
    headlines: [
      "Advanced chip export controls expanded to new countries",
      "Taiwan Strait military exercises disrupt fab schedules",
      "US-China tech decoupling accelerates — new entity list",
      "Semiconductor supply chain audit ordered by regulators",
    ],
  },
  "Financials": {
    geo: "monetary_policy",
    headlines: [
      "Fed signals rate hold — markets reprice duration",
      "ECB emergency rate statement surprises markets",
      "Bank of Japan yield-curve control exit signals",
      "Credit default swap spreads widen on EM exposure",
    ],
  },
  "Industrials": {
    geo: "military_escalation",
    headlines: [
      "Defense budget supplemental approved — $45B",
      "NATO logistics contracts accelerated",
      "Eastern European infrastructure rebuild tender opens",
      "Pentagon restocking order triggers supply chain surge",
    ],
  },
  "Materials": {
    geo: "trade_restrictions",
    headlines: [
      "Critical mineral export ban expands to 8 elements",
      "Copper futures spike on Chilean port strike",
      "China rare-earth quota cut by 30% for H2",
      "US tariff on aluminium imports doubled",
    ],
  },
  "Consumer Discretionary": {
    geo: "trade_restrictions",
    headlines: [
      "US-China tariff truce collapses — 45% on consumer goods",
      "Retail import costs surge on East Asia freight disruption",
      "EV battery supply chain under sanctions review",
      "Consumer confidence drops on geopolitical uncertainty",
    ],
  },
  "Consumer Staples": {
    geo: "energy_supply",
    headlines: [
      "Food commodity prices spike on Black Sea disruption",
      "Packaging input costs rise 18% on energy prices",
      "Supply chain normalisation slower than expected",
      "USDA revises crop yield forecast — drought impact",
    ],
  },
  "Health Care": {
    geo: "sanctions",
    headlines: [
      "API ingredient sourcing review — China dependency flagged",
      "Drug pricing legislation advances in Senate",
      "Biotech IP protection rules tightened in key markets",
      "FDA approvals accelerated for domestic manufacturers",
    ],
  },
  "Communication Services": {
    geo: "political_instability",
    headlines: [
      "Digital services tax proposed in G20 communiqué",
      "Platform regulation bill advances — antitrust scope widened",
      "Satellite spectrum allocation dispute escalates",
      "Advertising market softens on political uncertainty",
    ],
  },
  "Utilities": {
    geo: "energy_supply",
    headlines: [
      "Grid modernisation funding approved — $200B over 5 years",
      "Natural gas price spike pressures utility margins",
      "Renewable energy permitting reform passed",
      "Power grid cybersecurity audit ordered by FERC",
    ],
  },
  "Real Estate": {
    geo: "monetary_policy",
    headlines: [
      "30-year mortgage rate at 7.4% — refinance activity drops",
      "Office vacancy hits 22% nationally — structural shift confirmed",
      "Data centre REIT demand surges on AI infrastructure",
      "Fed rate path uncertainty hammers REIT valuations",
    ],
  },
};

function getTrigger(sector: string, seed2: number): TriggeringEvent {
  const entry = SECTOR_TRIGGERS[sector] ?? SECTOR_TRIGGERS["Information Technology"];
  const idx = Math.floor(seed2 * entry.headlines.length);
  const hoursAgo = Math.floor(seed2 * 18) + 1;
  const severity = clamp(55 + seed2 * 40);
  return {
    headline: entry.headlines[idx],
    category: entry.geo,
    severity,
    timeAgo: hoursAgo < 2 ? `${hoursAgo}h ago` : `${hoursAgo}h ago`,
  };
}

/* ── direction logic ─────────────────────────────────────────── */
const SECTOR_BIAS: Record<string, number> = {
  "Industrials": 0.7,   // slight buy bias (defence spend)
  "Energy": 0.6,
  "Information Technology": 0.6,
  "Health Care": 0.55,
  "Materials": 0.5,
  "Financials": 0.45,
  "Consumer Staples": 0.5,
  "Consumer Discretionary": 0.4,
  "Utilities": 0.45,
  "Real Estate": 0.35,  // rate headwinds
  "Communication Services": 0.5,
};

function direction(seed: number, sector: string): Direction {
  const bias = SECTOR_BIAS[sector] ?? 0.5;
  if (seed < bias * 0.65) return "BUY";
  if (seed > bias + 0.3) return "SELL";
  return "HOLD";
}

/* ── trade setup ─────────────────────────────────────────────── */
function tradeSetup(price: number, dir: Direction, seed: number) {
  const atrPct = 0.012 + seed * 0.025; // 1.2–3.7% daily ATR
  const atr = price * atrPct;

  let entry = price;
  let stopLoss: number;
  let target: number;

  if (dir === "BUY") {
    stopLoss = Math.round((price - atr * (1.5 + seed)) * 100) / 100;
    target   = Math.round((price + atr * (3 + seed * 2)) * 100) / 100;
  } else if (dir === "SELL") {
    stopLoss = Math.round((price + atr * (1.5 + seed)) * 100) / 100;
    target   = Math.round((price - atr * (3 + seed * 2)) * 100) / 100;
  } else {
    stopLoss = Math.round((price - atr * 1.2) * 100) / 100;
    target   = Math.round((price + atr * 1.2) * 100) / 100;
  }

  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(target - entry);
  const rr = risk > 0 ? Math.round((reward / risk) * 10) / 10 : 1.5;
  const maxPos = Math.round((1 + seed * 3.5) * 10) / 10;

  return {
    currentPrice: price,
    entry,
    stopLoss,
    target,
    riskReward: rr,
    atrDaily: Math.round(atrPct * 1000) / 10,
    maxPosition: maxPos,
  };
}

/* ── volatility ──────────────────────────────────────────────── */
function volatility(seed: number, sector: string): Volatility {
  const base = ["Energy", "Information Technology", "Financials"].includes(sector) ? 0.45 : 0.3;
  const v = base + seed * 0.5;
  if (v > 0.78) return "EXTREME";
  if (v > 0.58) return "HIGH";
  if (v > 0.38) return "MEDIUM";
  return "LOW";
}

function timeframe(seed: number): Timeframe {
  if (seed < 0.2) return "Intraday";
  if (seed < 0.55) return "Short-term";
  if (seed < 0.8) return "Medium-term";
  return "Long-term";
}

/* ── tags ────────────────────────────────────────────────────── */
const SECTOR_TAGS: Record<string, string[]> = {
  "Energy": ["oil", "global", "geopolitical"],
  "Information Technology": ["tech", "semis", "supply-chain"],
  "Financials": ["rates", "credit", "macro"],
  "Industrials": ["defence", "infrastructure", "capex"],
  "Materials": ["commodities", "China", "tariffs"],
  "Consumer Discretionary": ["consumer", "China", "retail"],
  "Consumer Staples": ["defensive", "input costs", "staples"],
  "Health Care": ["biotech", "regulation", "pharma"],
  "Communication Services": ["digital", "regulation", "media"],
  "Utilities": ["rates", "energy", "infrastructure"],
  "Real Estate": ["rates", "REIT", "duration"],
};

/* ── main export ─────────────────────────────────────────────── */
export function buildSignal(stock: StockConstituent): StockSignal {
  const seed1 = h32(stock.symbol);
  const seed2 = h32(stock.symbol + "2");
  const seed3 = h32(stock.symbol + "3");
  const seed4 = h32(stock.symbol + "4");

  const price = priceFor(stock.sector, seed1);
  const dir = direction(seed2, stock.sector);
  const conf = clamp(
    (dir === "HOLD" ? 55 : 66) + seed3 * 28 + (dir === "BUY" ? 2 : dir === "SELL" ? 3 : 0)
  );
  const uncertainty = clamp(100 - conf + (seed4 - 0.5) * 14);

  const vol = volatility(seed2, stock.sector);
  const tf = timeframe(seed3);
  const trigger = getTrigger(stock.sector, seed4);

  const bullStr = dir === "BUY"
    ? clamp(50 + seed3 * 45)
    : dir === "SELL"
    ? clamp(seed3 * 30)
    : clamp(30 + seed3 * 25);

  const bearStr = dir === "SELL"
    ? clamp(50 + seed4 * 45)
    : dir === "BUY"
    ? clamp(seed4 * 30)
    : clamp(30 + seed4 * 25);

  const tags = (SECTOR_TAGS[stock.sector] ?? ["market"]).slice(0, 3);
  const trade = tradeSetup(price, dir, seed2);
  const rrLabel = `RR ${trade.riskReward.toFixed(1)}`;

  const geoMap: Record<string, GeoSensitivity> = {
    "Energy": "energy_supply",
    "Industrials": "military_escalation",
    "Materials": "trade_restrictions",
    "Financials": "monetary_policy",
    "Health Care": "sanctions",
    "Consumer Discretionary": "trade_restrictions",
    "Consumer Staples": "energy_supply",
    "Communication Services": "political_instability",
    "Information Technology": "trade_restrictions",
    "Utilities": "energy_supply",
    "Real Estate": "monetary_policy",
  };

  return {
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    subIndustry: stock.subIndustry,
    assetClass: "Stocks",
    direction: dir,
    confidence: conf,
    uncertainty,
    bullStrength: bullStr,
    bearStrength: bearStr,
    volatility: vol,
    timeframe: tf,
    riskLevel: rrLabel,
    trigger,
    trade,
    tags,
    geoSensitivity: geoMap[stock.sector] ?? "none",
    updatedAt: "2026-04-23",
  };
}
