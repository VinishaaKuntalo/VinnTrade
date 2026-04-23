import { RISK_BAND_COLOR } from "@/types/stocks";
import type { RiskBand } from "@/types/stocks";

export function RiskScoreBar({
  score,
  band,
  size = "md",
}: {
  score: number;
  band: RiskBand;
  size?: "sm" | "md" | "lg";
}) {
  const color = RISK_BAND_COLOR[band];
  const h = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";
  return (
    <div className={`w-full rounded-full bg-slate-800 ${h} overflow-hidden`}>
      <div
        className={`${h} rounded-full transition-all duration-500`}
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  );
}
