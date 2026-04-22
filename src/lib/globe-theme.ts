import type { EventCategory } from "@/types/vinntrade";

export const categoryHex: Record<EventCategory, string> = {
  military: "#fb7185",
  sanctions: "#a78bfa",
  trade: "#22d3ee",
  monetary: "#fbbf24",
  energy: "#4ade80",
};

export const riskToPointRadius = (risk: number) =>
  0.35 + (Math.min(100, risk) / 100) * 0.55;
