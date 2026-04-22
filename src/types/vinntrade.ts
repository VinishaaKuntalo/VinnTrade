export type EventCategory =
  | "military"
  | "sanctions"
  | "trade"
  | "monetary"
  | "energy";

export const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = {
  military: "Security & military",
  sanctions: "Sanctions & law",
  trade: "Trade & supply chains",
  monetary: "Rates & policy",
  energy: "Energy & commodities",
};

export interface Hotspot {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  localRisk: number;
  category: EventCategory;
  shortSummary: string;
  investTakeaway: string;
}

export interface FlowArc {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  category: EventCategory;
  label: string;
  story: string;
}

export interface SignalItem {
  id: string;
  time: string;
  title: string;
  region: string;
  level: "elevated" | "notable" | "watch";
  category: EventCategory;
  plainEnglish: string;
  watchFor: string;
}

export interface MciSnapshot {
  value: number;
  trend: "up" | "down" | "flat";
  trendBps: number;
  asOf: string;
  blurb: string;
}
