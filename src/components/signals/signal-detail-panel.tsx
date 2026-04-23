import type { StockSignal } from "@/types/signals";
import { DIRECTION_COLOR, VOLATILITY_COLOR, GEO_SENSITIVITY_LABEL } from "@/types/signals";
import { cn } from "@/lib/cn";
import { X, Zap, MapPin, Info, TrendingUp, TrendingDown, ShieldAlert } from "lucide-react";

function PriceBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-slate-950/60 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn("mt-1 font-mono text-sm font-semibold", accent ?? "text-white")}>{value}</p>
    </div>
  );
}

export function SignalDetailPanel({
  signal,
  onClose,
}: {
  signal: StockSignal;
  onClose: () => void;
}) {
  const dc = DIRECTION_COLOR[signal.direction];
  const vc = VOLATILITY_COLOR[signal.volatility];
  const dirIcon =
    signal.direction === "BUY" ? (
      <TrendingUp className="h-4 w-4 text-emerald-400" />
    ) : signal.direction === "SELL" ? (
      <TrendingDown className="h-4 w-4 text-rose-400" />
    ) : null;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      {/* top accent bar */}
      <div
        className={cn(
          "h-1 w-full",
          signal.direction === "BUY"
            ? "bg-emerald-500"
            : signal.direction === "SELL"
            ? "bg-rose-500"
            : "bg-slate-500"
        )}
      />

      {/* header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {dirIcon}
            <span className="font-mono text-xl font-bold text-white">{signal.symbol}</span>
            <span className={cn("rounded border px-1.5 py-0.5 text-xs font-bold tracking-wide", dc)}>
              {signal.direction}
            </span>
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", vc)}>
              {signal.volatility} VOL
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-300">{signal.name}</p>
          <p className="text-xs text-slate-500">{signal.sector} · {signal.subIndustry}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* confidence + uncertainty */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/8 bg-slate-950/60 p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Confidence</p>
            <p
              className={cn(
                "mt-1 text-4xl font-bold tabular-nums",
                signal.direction === "BUY"
                  ? "text-emerald-300"
                  : signal.direction === "SELL"
                  ? "text-rose-300"
                  : "text-slate-300"
              )}
            >
              {signal.confidence}%
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-slate-950/60 p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Uncertainty</p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-amber-300">
              {signal.uncertainty}%
            </p>
          </div>
        </div>

        {/* bull/bear strength */}
        <div className="rounded-xl border border-white/8 bg-slate-950/40 p-4 space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Strength indicators
          </p>
          {[
            { label: "Bullish Strength", value: signal.bullStrength, color: "bg-emerald-500" },
            { label: "Bearish Strength", value: signal.bearStrength, color: "bg-rose-500" },
          ].map((row) => (
            <div key={row.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{row.label}</span>
                <span className="tabular-nums text-slate-300">{row.value}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={cn("h-2 rounded-full", row.color)}
                  style={{ width: `${row.value}%` }}
                />
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            {signal.tags.map((t) => (
              <span key={t} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                {t}
              </span>
            ))}
            <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium", vc)}>
              {signal.volatility} volatility
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
              {signal.timeframe}
            </span>
          </div>
        </div>

        {/* triggering event */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
              Triggering Event
            </p>
            <span className="ml-auto text-[10px] text-slate-500">{signal.trigger.timeAgo}</span>
          </div>
          <p className="text-sm font-medium text-amber-100/90">{signal.trigger.headline}</p>
          <div className="mt-2 flex items-center gap-2">
            <ShieldAlert className="h-3 w-3 text-slate-500" />
            <p className="text-[11px] text-slate-400">
              {GEO_SENSITIVITY_LABEL[signal.trigger.category]} · Severity {signal.trigger.severity}/100
            </p>
          </div>
        </div>

        {/* trade setup */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Trade Structure (educational)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <PriceBox label="Current Price" value={`$${signal.trade.currentPrice.toFixed(2)}`} />
            <PriceBox label="Entry" value={`$${fmt(signal.trade.entry)}`} accent="text-cyan-300" />
            <PriceBox
              label="Stop Loss"
              value={`$${fmt(signal.trade.stopLoss)}`}
              accent="text-rose-300"
            />
            <PriceBox
              label="Target"
              value={`$${fmt(signal.trade.target)}`}
              accent="text-emerald-300"
            />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <PriceBox
              label="Risk/Reward"
              value={`${signal.trade.riskReward.toFixed(1)}×`}
              accent="text-amber-300"
            />
            <PriceBox
              label="ATR (Daily)"
              value={`${signal.trade.atrDaily}%`}
              accent="text-amber-200"
            />
            <PriceBox
              label="Max Position"
              value={`${signal.trade.maxPosition}%`}
              accent="text-slate-200"
            />
          </div>
        </div>

        {/* geo */}
        <div className="rounded-lg border border-white/5 bg-slate-950/30 p-3 flex gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-cyan-500" />
          <div>
            <p className="text-[11px] text-slate-400 font-medium">
              {GEO_SENSITIVITY_LABEL[signal.geoSensitivity]}
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">{signal.sector} · {signal.subIndustry}</p>
          </div>
        </div>

        {/* disclaimer */}
        <div className="rounded-lg border border-white/5 bg-slate-950/20 p-3 flex gap-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-600" />
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Educational demo only. Signals are deterministic from sector/sub-industry data — not live
            market data, not financial advice. Entry/stop/target are illustrative. Always do your own
            research. Updated: {signal.updatedAt}.
          </p>
        </div>
      </div>
    </div>
  );
}
