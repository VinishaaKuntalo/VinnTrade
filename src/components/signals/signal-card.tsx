import type { StockSignal } from "@/types/signals";
import { DIRECTION_COLOR, VOLATILITY_COLOR } from "@/types/signals";
import { cn } from "@/lib/cn";
import { Zap } from "lucide-react";

export function SignalCard({
  signal,
  selected,
  onClick,
}: {
  signal: StockSignal;
  selected: boolean;
  onClick: () => void;
}) {
  const dc = DIRECTION_COLOR[signal.direction];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border transition-all",
        selected
          ? "border-cyan-500/40 bg-slate-800/80 shadow-lg shadow-cyan-500/8"
          : "border-white/6 bg-slate-900/40 hover:border-white/12 hover:bg-slate-800/40"
      )}
    >
      {/* direction accent line */}
      <div
        className={cn(
          "h-0.5 w-full rounded-t-xl",
          signal.direction === "BUY"
            ? "bg-emerald-500/60"
            : signal.direction === "SELL"
            ? "bg-rose-500/60"
            : "bg-slate-600/60"
        )}
      />

      <div className="p-3.5">
        {/* row 1 — ticker + direction + confidence */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold text-white tracking-wide">
                {signal.symbol}
              </span>
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wider",
                  dc
                )}
              >
                {signal.direction}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400 truncate leading-tight">
              {signal.name}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={cn(
                "text-xl font-bold tabular-nums leading-none",
                signal.direction === "BUY"
                  ? "text-emerald-300"
                  : signal.direction === "SELL"
                  ? "text-rose-300"
                  : "text-slate-300"
              )}
            >
              {signal.confidence}%
            </p>
            <p className="text-[9px] text-slate-600 mt-0.5">confidence</p>
          </div>
        </div>

        {/* row 2 — bull/bear bars */}
        <div className="mt-2.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-8 text-[10px] text-emerald-400/80 font-medium shrink-0">Bull</span>
            <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-1 rounded-full bg-emerald-500"
                style={{ width: `${signal.bullStrength}%` }}
              />
            </div>
            <span className="w-7 text-right text-[10px] text-slate-500 tabular-nums shrink-0">
              {signal.bullStrength}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 text-[10px] text-rose-400/80 font-medium shrink-0">Bear</span>
            <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-1 rounded-full bg-rose-500"
                style={{ width: `${signal.bearStrength}%` }}
              />
            </div>
            <span className="w-7 text-right text-[10px] text-slate-500 tabular-nums shrink-0">
              {signal.bearStrength}%
            </span>
          </div>
        </div>

        {/* row 3 — tags */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
              VOLATILITY_COLOR[signal.volatility]
            )}
          >
            VOL: {signal.volatility}
          </span>
          <span className="rounded bg-slate-800/70 px-1.5 py-0.5 text-[9px] text-slate-500">
            {signal.timeframe}
          </span>
          <span className="rounded bg-slate-800/70 px-1.5 py-0.5 text-[9px] text-slate-500">
            {signal.riskLevel}
          </span>
        </div>

        {/* row 4 — trigger */}
        <div className="mt-2 flex items-start gap-1.5">
          <Zap className="h-3 w-3 mt-0.5 shrink-0 text-amber-400/80" />
          <p className="text-[10px] text-slate-500 line-clamp-1 leading-tight">
            {signal.trigger.headline}
          </p>
        </div>
      </div>
    </button>
  );
}
