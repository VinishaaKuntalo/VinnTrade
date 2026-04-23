"use client";

import { useMemo, useState } from "react";
import constituentsList from "@/data/sp500-constituents.json";
import { buildSignal } from "@/lib/signal-engine";
import type { StockSignal } from "@/types/signals";
import type { Direction, GeoSensitivity } from "@/types/signals";
import { GEO_SENSITIVITY_LABEL, DIRECTION_COLOR } from "@/types/signals";
import type { StockConstituent } from "@/types/stocks";
import { SignalCard } from "./signal-card";
import { SignalDetailPanel } from "./signal-detail-panel";
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
} from "lucide-react";

const constituents = constituentsList as StockConstituent[];

/* build all signals once (deterministic) */
const ALL_SIGNALS: StockSignal[] = constituents.map(buildSignal);

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
  BUY: ALL_SIGNALS.filter((s) => s.direction === "BUY").length,
  SELL: ALL_SIGNALS.filter((s) => s.direction === "SELL").length,
  HOLD: ALL_SIGNALS.filter((s) => s.direction === "HOLD").length,
};

export function SignalsBrowser() {
  const [query, setQuery] = useState("");
  const [dirFilter, setDirFilter] = useState<Direction | "ALL">("ALL");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [geoFilter, setGeoFilter] = useState<GeoSensitivity | "all">("all");
  const [selected, setSelected] = useState<StockSignal | null>(ALL_SIGNALS[0] ?? null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return ALL_SIGNALS.filter((s) => {
      if (q && !s.symbol.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q)) return false;
      if (dirFilter !== "ALL" && s.direction !== dirFilter) return false;
      if (sectorFilter !== "All" && s.sector !== sectorFilter) return false;
      if (geoFilter !== "all" && s.geoSensitivity !== geoFilter) return false;
      return true;
    });
  }, [query, dirFilter, sectorFilter, geoFilter]);

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

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── LEFT SIDEBAR ── */}
      <aside className="hidden lg:flex w-52 shrink-0 flex-col border-r border-white/8 bg-slate-950 overflow-y-auto">
        <div className="p-3 border-b border-white/8">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 px-1 mb-1">
            Asset class
          </p>
          <button className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm bg-white/10 text-white font-medium">
            <BarChart3 className="h-4 w-4 text-amber-400" />
            S&amp;P 500 Stocks
            <span className="ml-auto text-xs text-slate-500 font-mono">{ALL_SIGNALS.length}</span>
          </button>
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
                    key={sig.symbol}
                    signal={sig}
                    selected={selected?.symbol === sig.symbol}
                    onClick={() => setSelected(sig)}
                  />
                ))
              )}
            </div>
          </div>

          {/* detail panel */}
          <div className="hidden lg:flex flex-1 overflow-hidden p-4">
            {selected ? (
              <div className="w-full max-w-lg mx-auto h-full">
                <SignalDetailPanel
                  signal={selected}
                  onClose={() => setSelected(null)}
                />
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <Zap className="h-8 w-8 text-slate-700" />
                <p className="text-sm text-slate-500">Select a signal to see the full analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
