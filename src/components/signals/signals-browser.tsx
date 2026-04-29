"use client";

import { useMemo, useState } from "react";
import constituentsList from "@/data/sp500-constituents.json";
import { EXTRA_ASSETS } from "@/data/extra-assets";
import { buildSignal, buildExtraSignal } from "@/lib/signal-engine";
import type { StockSignal, AssetClass } from "@/types/signals";
import type { Direction, GeoSensitivity } from "@/types/signals";
import { GEO_SENSITIVITY_LABEL } from "@/types/signals";
import type { StockConstituent } from "@/types/stocks";
import { SignalCard } from "./signal-card";
import { SignalDetailPanel } from "./signal-detail-panel";
import { RealSignalOverlay, RealSignalSkeleton, RealSignalError, RealSignalRateLimited } from "./real-signal-overlay";
import { useRealSignal } from "@/hooks/use-real-signal";
import { cn } from "@/lib/cn";
import {
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Zap,
  BarChart3,
  Layers,
} from "lucide-react";

const constituents = constituentsList as StockConstituent[];

/* build all signals once (deterministic) */
const STOCK_SIGNALS: StockSignal[] = constituents.map(buildSignal);
// avoid duplicate symbol+assetClass combinations
const seenKeys = new Set<string>();
const EXTRA_SIGNALS: StockSignal[] = EXTRA_ASSETS.flatMap((a) => {
  const key = `${a.symbol}-${a.assetClass}`;
  if (seenKeys.has(key)) return [];
  seenKeys.add(key);
  return [buildExtraSignal(a)];
});
const ALL_SIGNALS: StockSignal[] = [...EXTRA_SIGNALS, ...STOCK_SIGNALS];

const ASSET_CLASSES: { id: AssetClass | "All"; label: string; count: number }[] = [
  { id: "All",         label: "All assets",      count: ALL_SIGNALS.length },
  { id: "Commodities", label: "Commodities",      count: ALL_SIGNALS.filter(s => s.assetClass === "Commodities").length },
  { id: "Indices",     label: "Equity Indices",   count: ALL_SIGNALS.filter(s => s.assetClass === "Indices").length },
  { id: "Forex",       label: "Forex",            count: ALL_SIGNALS.filter(s => s.assetClass === "Forex").length },
  { id: "Crypto",      label: "Crypto",           count: ALL_SIGNALS.filter(s => s.assetClass === "Crypto").length },
  { id: "Stocks",      label: "S&P 500 Stocks",   count: STOCK_SIGNALS.length },
  { id: "ETFs",        label: "ETFs",             count: ALL_SIGNALS.filter(s => s.assetClass === "ETFs").length },
  { id: "Bonds",       label: "Bonds",            count: ALL_SIGNALS.filter(s => s.assetClass === "Bonds").length },
];

const ALL_SECTORS = ["All", ...Array.from(new Set(ALL_SIGNALS.map((s) => s.sector))).sort()];
const GEO_FILTERS: { id: GeoSensitivity | "all"; label: string }[] = [
  { id: "all", label: "All events" },
  { id: "military_escalation", label: "Military escalation" },
  { id: "energy_supply", label: "Energy supply" },
  { id: "trade_restrictions", label: "Trade restrictions" },
  { id: "sanctions", label: "Sanctions" },
  { id: "political_instability", label: "Political instability" },
  { id: "monetary_policy", label: "Monetary policy" },
];

const DIR_STATS = {
  BUY:  ALL_SIGNALS.filter((s) => s.direction === "BUY").length,
  SELL: ALL_SIGNALS.filter((s) => s.direction === "SELL").length,
  HOLD: ALL_SIGNALS.filter((s) => s.direction === "HOLD").length,
};

function RealPanel({ selected, onClose }: { selected: StockSignal; onClose: () => void }) {
  const state = useRealSignal(selected.symbol);
  if (state.status === "idle" || state.status === "loading")
    return <RealSignalSkeleton symbol={selected.symbol} onClose={onClose} />;
  if (state.status === "rate_limited")
    return <RealSignalRateLimited symbol={selected.symbol} countdown={state.countdown} onRetry={state.retry} onClose={onClose} />;
  if (state.status === "error")
    return <RealSignalError symbol={selected.symbol} message={state.message} onClose={onClose} />;
  return <RealSignalOverlay real={state.data} base={selected} onClose={onClose} />;
}

export function SignalsBrowser() {
  const [query, setQuery] = useState("");
  const [dirFilter, setDirFilter] = useState<Direction | "ALL">("ALL");
  const [assetFilter, setAssetFilter] = useState<AssetClass | "All">("All");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [geoFilter, setGeoFilter] = useState<GeoSensitivity | "all">("all");
  const [selected, setSelected] = useState<StockSignal | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return ALL_SIGNALS.filter((s) => {
      if (q && !s.symbol.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q)) return false;
      if (dirFilter !== "ALL" && s.direction !== dirFilter) return false;
      if (assetFilter !== "All" && s.assetClass !== assetFilter) return false;
      if (sectorFilter !== "All" && s.sector !== sectorFilter) return false;
      if (geoFilter !== "all" && s.geoSensitivity !== geoFilter) return false;
      return true;
    });
  }, [query, dirFilter, assetFilter, sectorFilter, geoFilter]);

  const dirBtn = (d: Direction | "ALL", icon: React.ReactNode, count?: number) => (
    <button
      key={d}
      type="button"
      onClick={() => setDirFilter(d)}
      className={cn(
        "flex items-center gap-1.5 w-full rounded-lg px-3 py-2 text-sm transition",
        dirFilter === d
          ? "bg-white/10 text-white font-medium"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      {d === "ALL" ? "All" : d}
      {count !== undefined && (
        <span className="ml-auto text-xs text-slate-500 font-mono">{count}</span>
      )}
    </button>
  );

  /* Global Tension Index — average trigger severity across all signals */
  const GTI = Math.round(
    ALL_SIGNALS.reduce((s, sig) => s + sig.trigger.severity, 0) / ALL_SIGNALS.length
  );
  const gtiLabel =
    GTI > 80 ? "CRITICAL" : GTI > 65 ? "ELEVATED" : GTI > 45 ? "MODERATE" : "LOW";
  const gtiColor =
    GTI > 80 ? "text-rose-400 border-rose-500/40 bg-rose-500/10"
    : GTI > 65 ? "text-amber-300 border-amber-500/40 bg-amber-500/10"
    : GTI > 45 ? "text-yellow-300 border-yellow-500/40 bg-yellow-500/10"
    : "text-emerald-300 border-emerald-500/40 bg-emerald-500/10";

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── GTI STATUS BAR ── */}
      <div className="flex shrink-0 items-center gap-4 border-b border-white/6 bg-slate-950/90 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Global Tension Index
          </span>
          <span className="font-mono text-lg font-bold text-white tabular-nums">{GTI}</span>
          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${gtiColor}`}>
            {gtiLabel}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            LIVE · demo feeds
          </span>
          <span className="font-mono tabular-nums">
            {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC
          </span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* ── LEFT SIDEBAR ── */}
      <aside className="hidden lg:flex w-52 shrink-0 flex-col border-r border-white/8 bg-slate-950 overflow-y-auto">
        <div className="p-3 border-b border-white/8">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 px-1 mb-1.5">
            Asset class
          </p>
          <div className="space-y-0.5">
            {ASSET_CLASSES.map((ac) => (
              <button
                key={ac.id}
                type="button"
                onClick={() => { setAssetFilter(ac.id); setSectorFilter("All"); }}
                className={cn(
                  "flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition",
                  assetFilter === ac.id
                    ? "bg-white/10 text-white font-medium"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {ac.id === "All" ? <Layers className="h-3.5 w-3.5 text-slate-500" /> : <BarChart3 className="h-3.5 w-3.5 text-slate-500" />}
                <span className="truncate">{ac.label}</span>
                <span className="ml-auto text-xs text-slate-600 font-mono shrink-0">{ac.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-b border-white/8">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 px-1 mb-1">
            Direction
          </p>
          <div className="space-y-0.5">
            {dirBtn("ALL", <Activity className="h-4 w-4" />, ALL_SIGNALS.length)}
            {dirBtn("BUY", <TrendingUp className="h-4 w-4 text-emerald-400" />, DIR_STATS.BUY)}
            {dirBtn("SELL", <TrendingDown className="h-4 w-4 text-rose-400" />, DIR_STATS.SELL)}
            {dirBtn("HOLD", <Minus className="h-4 w-4 text-slate-400" />, DIR_STATS.HOLD)}
          </div>
        </div>

        <div className="p-3 border-b border-white/8">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 px-1 mb-1">
            Geo sensitivity
          </p>
          <div className="space-y-0.5">
            {GEO_FILTERS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGeoFilter(g.id)}
                className={cn(
                  "flex w-full rounded-lg px-3 py-1.5 text-left text-xs transition leading-snug",
                  geoFilter === g.id
                    ? "bg-white/10 text-white font-medium"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 px-1 mb-1">
            Sector
          </p>
          <div className="space-y-0.5">
            {ALL_SECTORS.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSectorFilter(sec)}
                className={cn(
                  "flex w-full rounded-lg px-3 py-1.5 text-left text-xs transition leading-snug",
                  sectorFilter === sec
                    ? "bg-white/10 text-white font-medium"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── CARD LIST ── */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        {/* toolbar */}
        <div className="flex items-center gap-3 border-b border-white/8 bg-slate-950/80 px-4 py-3 backdrop-blur">
          {/* mobile direction pills */}
          <div className="flex gap-1.5 lg:hidden">
            {(["ALL", "BUY", "SELL", "HOLD"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirFilter(d)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                  dirFilter === d
                    ? d === "BUY"
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                      : d === "SELL"
                      ? "border-rose-500/40 bg-rose-500/15 text-rose-200"
                      : "border-white/20 bg-white/10 text-white"
                    : "border-white/10 text-slate-400 hover:text-white"
                )}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search symbol or company…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900 pl-8 pr-8 py-1.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
            />
            {query && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" onClick={() => setQuery("")}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="shrink-0 text-xs text-slate-500">{filtered.length} signals</p>
        </div>

        {/* cards + detail panel */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* card scroll */}
          <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 overflow-y-auto border-r border-white/8 bg-slate-950/50">
            <div className="space-y-2 p-3">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-500">
                  No signals match your filters.
                </div>
              ) : (
                filtered.map((sig) => (
                  <SignalCard
                    key={`${sig.symbol}-${sig.assetClass}`}
                    signal={sig}
                    selected={selected?.symbol === sig.symbol}
                    onClick={() => setSelected(sig)}
                  />
                ))
              )}
            </div>
          </div>

          {/* detail panel — real market data */}
          <div className="hidden lg:flex flex-1 overflow-hidden p-4">
            {selected ? (
              <div className="w-full max-w-lg mx-auto h-full">
                <RealPanel selected={selected} onClose={() => setSelected(null)} />
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <Zap className="h-8 w-8 text-slate-700" />
                <p className="text-sm text-slate-500">
                  Select a signal to fetch real data from Yahoo Finance
                </p>
                <p className="text-xs text-slate-600 max-w-xs">
                  RSI · MACD · EMA crossover · ATR · momentum — computed from live historical OHLCV
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
