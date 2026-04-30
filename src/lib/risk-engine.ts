/**
 * Deterministic (seeded) risk model — educational / illustrative.
 * All scores are derived from sector, sub-industry, and HQ geography.
 * Nothing here is live market data or financial advice.
 */
import type { RiskBand, RiskFactor, StockRiskProfile, StockConstituent } from "@/types/stocks";
import { RISK_BAND_LABEL } from "@/types/stocks";

/* ── helpers ──────────────────────────────────────────────────── */

function seedHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (Math.imul(h, 0x01000193) >>> 0);
  }
  return (h >>> 0) / 4294967296;
}

function clamp(v: number, lo = 0, hi = 100) {
  return Math.min(hi, Math.max(lo, Math.round(v)));
}

/* ── sector baselines ─────────────────────────────────────────── */

const SECTOR_BASELINE: Record<string, number> = {
  "Information Technology": 58,
  "Health Care": 44,
  "Financials": 62,
  "Consumer Discretionary": 52,
  "Consumer Staples": 30,
  "Energy": 72,
  "Materials": 66,
  "Industrials": 50,
  "Utilities": 36,
  "Real Estate": 48,
  "Communication Services": 54,
};

/* ── sub-industry overlays ────────────────────────────────────── */

const SUB_OVERLAY: Record<string, number> = {
  "Semiconductors": 18,
  "Semiconductor Materials & Equipment": 16,
  "Electronic Equipment & Instruments": 10,
  "Oil & Gas Exploration & Production": 20,
  "Oil & Gas Refining & Marketing": 14,
  "Integrated Oil & Gas": 16,
  "Biotechnology": 14,
  "Pharmaceuticals": 8,
  "Airlines": 18,
  "Defense": 14,
  "Aerospace & Defense": 14,
  "Commodity Chemicals": 12,
  "Specialty Chemicals": 8,
  "Regional Banks": 10,
  "Diversified Banks": 8,
  "Investment Banking & Brokerage": 12,
  "Consumer Finance": 10,
  "Food Products": -8,
  "Household Products": -10,
  "Electric Utilities": -10,
  "Water Utilities": -14,
  "Multi-Utilities": -10,
  "Drug Retail": -4,
  "Application Software": 8,
  "Systems Software": 10,
  "Internet Services & Infrastructure": 6,
  "Interactive Media & Services": 6,
  "IT Consulting & Other Services": 4,
  "Technology Hardware, Storage & Peripherals": 12,
  "Health Care Facilities": 6,
};

/* ── geo score ────────────────────────────────────────────────── */

function geoScore(hq: string): number {
  if (!hq) return 0;
  const h = hq.toLowerCase();
  if (h.includes("china") || h.includes("taiwan")) return 18;
  if (h.includes("russia")) return 22;
  if (h.includes("saudi") || h.includes("dubai") || h.includes("uae")) return 12;
  if (h.includes("ireland") || h.includes("netherlands") || h.includes("switzerland")) return 3;
  if (h.includes("united kingdom") || h.includes("london")) return 4;
  if (h.includes("india")) return 6;
  if (h.includes("canada")) return 2;
  if (h.includes("australia") || h.includes("new zealand")) return 2;
  return 0;
}

/* ── factor notes ─────────────────────────────────────────────── */

function scoreNote(score: number, prefix: string): string {
  if (score < 35) return `${prefix} relatively contained — typical for this profile.`;
  if (score < 55) return `${prefix} moderate; monitor for sector-wide shifts.`;
  if (score < 70) return `${prefix} elevated — worth checking your portfolio weight.`;
  return `${prefix} high — apply extra due diligence before sizing a position.`;
}

/* ── build factor list ────────────────────────────────────────── */

function buildFactors(stock: StockConstituent, seed: number): RiskFactor[] {
  const base = SECTOR_BASELINE[stock.sector] ?? 50;
  const sub = SUB_OVERLAY[stock.subIndustry] ?? 0;
  const geo = geoScore(stock.hq);
  const si = stock.subIndustry.toLowerCase();

  const supplyConcentration = si.includes("semiconductor")
    ? 76
    : si.includes("hardware")
    ? 62
    : clamp(base + seed * 12 - 4 + sub * 0.3);

  const geoReg = clamp(base * 0.45 + geo * 2.2 + sub * 0.4 + seed * 8);

  const macroSensitivity = clamp(
    (["Financials", "Real Estate", "Utilities", "Consumer Discretionary"].includes(stock.sector) ? 62 : 42)
    + (seed - 0.5) * 18
  );

  const earningsVol = clamp(base * 0.55 + sub * 0.5 + (seed - 0.3) * 22);

  const esgReg = clamp(
    (["Energy", "Materials", "Utilities"].includes(stock.sector) ? 60 : 38)
    + (seed - 0.4) * 16
  );

  return [
    {
      label: "Supply-chain concentration",
      score: supplyConcentration,
      note: scoreNote(supplyConcentration, "Input sourcing is"),
    },
    {
      label: "Geopolitical & regulatory exposure",
      score: geoReg,
      note: scoreNote(geoReg, "Cross-border policy exposure is"),
    },
    {
      label: "Macro & rate sensitivity",
      score: macroSensitivity,
      note: scoreNote(macroSensitivity, "Rate and growth cycle sensitivity is"),
    },
    {
      label: "Earnings volatility",
      score: earningsVol,
      note: scoreNote(earningsVol, "Historical earnings variability is"),
    },
    {
      label: "ESG & environmental regulation",
      score: esgReg,
      note: scoreNote(esgReg, "Regulatory transition risk is"),
    },
  ];
}

/* ── band & geo label ─────────────────────────────────────────── */

/** Maps overall risk score (0–100) to display band — single source of truth for labels in the UI. */
export function scoreToRiskBand(score: number): RiskBand {
  if (score < 30) return "low";
  if (score < 45) return "moderate";
  if (score < 60) return "elevated";
  if (score < 75) return "high";
  return "critical";
}

/** Plain-language explanation of why this numeric score maps to its band (thresholds match `scoreToRiskBand`). */
export function describeWhyRiskBand(score: number, band: RiskBand): string {
  const label = RISK_BAND_LABEL[band];
  return `Overall score is ${score} out of 100. This model uses fixed cutoffs on that scale: Low below 30; Moderate 30–44; Elevated 45–59; High 60–74; Critical 75 and above. Your score falls in the ${label} band.`;
}

/** How the overall number is built (shown next to the score). */
export const RISK_OVERALL_SCORE_EXPLAINER =
  "We average five factor scores (supply-chain concentration, geopolitical & regulatory exposure, macro & rate sensitivity, earnings volatility, ESG & environmental regulation). Then we add a small geography adjustment from headquarters and a tiny deterministic tweak from the ticker so similar names are not identical. All of this is illustrative — not live market data or advice.";

function geoExposure(hq: string): string {
  const h = hq.toLowerCase();
  if (h.includes("taiwan") || h.includes("china")) return "East Asia — elevated geopolitical scrutiny";
  if (h.includes("ireland") || h.includes("netherlands")) return "Europe (tax domicile) — relatively stable";
  if (h.includes("united kingdom") || h.includes("london")) return "United Kingdom — post-Brexit regulatory backdrop";
  if (h.includes("india")) return "South Asia — high-growth, regulatory-evolving market";
  if (h.includes("switzerland")) return "Switzerland — neutral, stable regulatory base";
  if (h.includes("canada")) return "Canada — closely integrated with US trade";
  return "United States — domestic market, familiar regulatory environment";
}

const INVESTOR_ANGLES: Record<string, string> = {
  "Information Technology":
    "Tech reprices fast on earnings misses, rate rises, and supply-chain surprises. Duration sensitivity matters as much as revenue growth.",
  "Health Care":
    "Drug pipelines, patent cliffs, and pricing regulation create idiosyncratic risk. Biotech carries binary event risk; large pharma is more defensive.",
  "Financials":
    "Banks and insurers amplify macro cycles. Watch net interest margins, credit quality, and regulatory capital requirements.",
  "Consumer Discretionary":
    "Highly rate-sensitive — reprices as consumer purchasing power shifts. China exposure matters for luxury and auto names.",
  "Consumer Staples":
    "Traditionally defensive, but input cost inflation (energy, packaging, commodities) can compress margins ahead of pricing power.",
  "Energy":
    "Dual exposure: commodity price risk and accelerating energy-transition policy. Reserve-life and capex discipline matter.",
  "Materials":
    "Commodity cycles, environmental regulation, and China demand drive this sector. Sub-industry diversification reduces single-commodity concentration.",
  "Industrials":
    "Defense and aerospace benefit from elevated security spending; transport and logistics are sensitive to freight cycles and fuel costs.",
  "Utilities":
    "Rate-bond proxies — rising long rates are a headwind. Clean-energy mandates create capex cycles that can stretch balance sheets.",
  "Real Estate":
    "REITs carry direct duration risk. Office and retail face structural headwinds; logistics and data centres are growth-oriented sub-sectors.",
  "Communication Services":
    "Streaming, advertising, and telecom have very different margin and regulation profiles within the same sector label.",
};

/* ── public API ───────────────────────────────────────────────── */

export function buildRiskProfile(stock: StockConstituent): StockRiskProfile {
  const seed = seedHash(stock.symbol);
  const sub = SUB_OVERLAY[stock.subIndustry] ?? 0;
  const geo = geoScore(stock.hq);
  const factors = buildFactors(stock, seed);
  const overall = clamp(
    factors.reduce((a, f) => a + f.score, 0) / factors.length
    + geo * 0.35
    + (seed - 0.5) * 6
    + sub * 0.1
  );

  return {
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    subIndustry: stock.subIndustry,
    hq: stock.hq,
    overallScore: overall,
    band: scoreToRiskBand(overall),
    factors,
    geoExposure: geoExposure(stock.hq),
    investorAngle:
      INVESTOR_ANGLES[stock.sector] ??
      "Review sector-specific risks and your own exposure before acting.",
    updatedAt: "2026-04-22",
  };
}
