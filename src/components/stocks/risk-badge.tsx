import { RISK_BAND_BG, RISK_BAND_LABEL } from "@/types/stocks";
import type { RiskBand } from "@/types/stocks";
import { cn } from "@/lib/cn";

export function RiskBadge({
  band,
  size = "sm",
}: {
  band: RiskBand;
  size?: "xs" | "sm";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        RISK_BAND_BG[band],
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      )}
    >
      {RISK_BAND_LABEL[band]}
    </span>
  );
}
