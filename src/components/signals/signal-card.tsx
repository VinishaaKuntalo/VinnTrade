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
        "w-full text-left rounded-xl border p-4 transition-all",
        selected
          ? "border-cyan-500/50 bg-slate-800/70 shadow-lg shadow-cyan-500/10"
          : "border-white/8 bg-slate-900/60 hover:border-white/15 hover:bg-slate-800/50"
      )}
    >
      {/* row 1 — ticker + direction + confidence */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-white">{signal.symbol}</span>
            <span className={cn("rounded border px-1.5 py-0.5 text-[11px] font-bold tracking-wide", dc)}>
              {signal.direction}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400 truncate">{signal.name}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold tabular-nums text-white">{signal.confidence}%</p>
          <p className="text-[10px] text-slate-500">confidence</p>
        </div>
      </div>

      {/* row 2 — bull/bear bars */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-8 text-[10px] text-emerald-400/80 font-medium">Bull</span>
          <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${signal.bullStrength}%` }}
            />
          </div>
          <span className="w-7 text-right text-[10px] text-slate-500 tabular-nums">{signal.bullStrength}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-8 text-[10px] text-rose-400/80 font-medium">Bear</span>
          <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-rose-500 transition-all"
              style={{ width: `${signal.bearStrength}%` }}
            />
          </div>
          <span className="w-7 text-right text-[10px] text-slate-500 tabular-nums">{signal.bearStrength}%</span>
        </div>
      </div>

      {/* row 3 — tags */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", VOLATILITY_COLOR[signal.volatility])}>
          VOL: {signal.volatility}
        </span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
          {signal.timeframe}
        </span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
          {signal.riskLevel}
        </span>
      </div>

      {/* row 4 — trigger */}
      <div className="mt-2.5 flex items-start gap-1.5">
        <Zap className="h-3 w-3 mt-0.5 shrink-0 text-amber-400" />
        <p className="text-[11px] text-slate-400 line-clamp-1">{signal.trigger.headline}</p>
      </div>
    </button>
  );
}
