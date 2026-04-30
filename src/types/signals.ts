export type Direction = "BUY" | "SELL" | "HOLD";
export type Volatility = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
export type Timeframe = "Intraday" | "Short-term" | "Medium-term" | "Long-term";
export type AssetClass = "Stocks" | "Commodities" | "Indices" | "ETFs" | "Bonds" | "Forex" | "Crypto";
export type GeoSensitivity =
  | "military_escalation"
  | "energy_supply"
  | "trade_restrictions"
  | "sanctions"
  | "political_instability"
  | "monetary_policy"
  | "none";

export interface TriggeringEvent {
  headline: string;
  category: GeoSensitivity;
  severity: number;  // 0–100
  timeAgo: string;
}

export interface TradeSetup {
  currentPrice: number;
  entry: number;
  stopLoss: number;
  target: number;
  riskReward: number;
  atrDaily: number;    // % ATR
  maxPosition: number; // % of portfolio
}

export interface StockSignal {
  symbol: string;
  name: string;
  sector: string;
  subIndustry: string;
  assetClass: AssetClass;
  direction: Direction;
  confidence: number; // 0–100; demo signals use a narrow illustrative band; live chart scores are uncertainty-adjusted
  bullStrength: number;    // 0–100
  bearStrength: number;    // 0–100
  volatility: Volatility;
  timeframe: Timeframe;
  riskLevel: string;       // "RR 1.8" etc.
  trigger: TriggeringEvent;
  trade: TradeSetup;
  tags: string[];
  geoSensitivity: GeoSensitivity;
  updatedAt: string;
}

export const DIRECTION_COLOR: Record<Direction, string> = {
  BUY: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  SELL: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  HOLD: "bg-slate-500/20 text-slate-300 border-slate-500/40",
};

export const VOLATILITY_COLOR: Record<Volatility, string> = {
  LOW: "bg-emerald-500/15 text-emerald-300",
  MEDIUM: "bg-amber-500/15 text-amber-300",
  HIGH: "bg-orange-500/15 text-orange-300",
  EXTREME: "bg-rose-500/15 text-rose-300",
};

export const GEO_SENSITIVITY_LABEL: Record<GeoSensitivity, string> = {
  military_escalation: "Military escalation",
  energy_supply: "Energy supply disruption",
  trade_restrictions: "Trade restrictions",
  sanctions: "Sanctions",
  political_instability: "Political instability",
  monetary_policy: "Monetary policy",
  none: "General market",
};
