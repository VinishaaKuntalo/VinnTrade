export type RiskBand = "low" | "moderate" | "elevated" | "high" | "critical";

export interface StockConstituent {
  symbol: string;
  name: string;
  sector: string;
  subIndustry: string;
  hq: string;
}

export interface RiskFactor {
  label: string;
  score: number;
  note: string;
}

export interface StockRiskProfile {
  symbol: string;
  name: string;
  sector: string;
  subIndustry: string;
  hq: string;
  overallScore: number;
  band: RiskBand;
  factors: RiskFactor[];
  geoExposure: string;
  investorAngle: string;
  updatedAt: string;
}

export const RISK_BAND_LABEL: Record<RiskBand, string> = {
  low: "Low",
  moderate: "Moderate",
  elevated: "Elevated",
  high: "High",
  critical: "Critical",
};

export const RISK_BAND_COLOR: Record<RiskBand, string> = {
  low: "#4ade80",
  moderate: "#a3e635",
  elevated: "#fbbf24",
  high: "#fb923c",
  critical: "#f43f5e",
};

export const RISK_BAND_BG: Record<RiskBand, string> = {
  low: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  moderate: "bg-lime-500/15 text-lime-200 border-lime-500/30",
  elevated: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  high: "bg-orange-500/15 text-orange-200 border-orange-500/30",
  critical: "bg-rose-500/15 text-rose-200 border-rose-500/30",
};
