"use client";

import { useEffect, useState } from "react";
import type { StockSignal } from "@/types/signals";
import type { RealSignal } from "@/app/api/signal/[symbol]/route";
import { cn } from "@/lib/cn";
import { TrendingUp, TrendingDown, Minus, Zap, ChevronUp, ChevronDown } from "lucide-react";

/* ── Live indicator cache (shared across mounts) ─────────── */
const liveCache = new Map<string, RealSignal>();

/* ── Column definitions ──────────────────────────────────── */
type SortKey = "symbol" | "confidence" | "rs" | "rsi" | "macd" | "alpha" | "beta" | "gamma" | "theta" | "stochK" | "wR" | "roc" | "atr";

interface Col {
  key: SortKey;
  label: string;
  abbr: string;
  tooltip: string;
  live: boolean;   // requires live API data
  width: string;
  align: "left" | "right" | "center";
}

const COLS: Col[] = [
  { key: "rs",       label: "RS",     abbr: "RS",    tooltip: "Relative Strength — 52-week price position (0–100)",               live: true,  width: "w-14",  align: "right" },
  { key: "rsi",      label: "RSI",    abbr: "RSI",   tooltip: "RSI(14) — momentum oscillator (30 oversold · 70 overbought)",      live: true,  width: "w-14",  align: "right" },
  { key: "macd",     label: "MACD",   abbr: "MACD",  tooltip: "MACD Histogram — trend momentum (positive = bullish)",             live: true,  width: "w-20",  align: "right" },
  { key: "alpha",    label: "α",      abbr: "α",     tooltip: "Alpha — 63-day excess momentum proxy (−100 to +100)",              live: true,  width: "w-14",  align: "right" },
  { key: "beta",     label: "β",      abbr: "β",     tooltip: "Beta — ATR-based volatility vs market baseline (~1.0 = neutral)",  live: true,  width: "w-14",  align: "right" },
  { key: "gamma",    label: "γ",      abbr: "γ",     tooltip: "Gamma — RSI acceleration (change over 5 bars)",                   live: true,  width: "w-14",  align: "right" },
  { key: "theta",    label: "θ",      abbr: "θ",     tooltip: "Theta — trend persistence: % of last 20 bars above/below EMA20",  live: true,  width: "w-14",  align: "right" },
  { key: "stochK",   label: "Stoch",  abbr: "%K",    tooltip: "Stochastic %K(14) — momentum position in recent range",           live: true,  width: "w-14",  align: "right" },
  { key: "wR",       label: "W%R",    abbr: "W%R",   tooltip: "Williams %R(14) — overbought/oversold indicator (−100 to 0)",     live: true,  width: "w-14",  align: "right" },
  { key: "roc",      label: "ROC",    abbr: "ROC",   tooltip: "Rate of Change(14) — 14-bar momentum %",                         live: true,  width: "w-16",  align: "right" },
  { key: "atr",      label: "ATR%",   abbr: "ATR%",  tooltip: "ATR as % of price — daily volatility estimate",                   live: true,  width: "w-16",  align: "right" },
];

/* ── Color helpers ───────────────────────────────────────── */
function rsiColor(v: number) {
  if (v < 30) return "text-emerald-400 bg-emerald-400/10";
  if (v > 70) return "text-rose-400 bg-rose-400/10";
  if (v < 45) return "text-emerald-300/70";
  if (v > 55) return "text-rose-300/70";
  return "text-slate-400";
}
function signColor(v: number, reverse = false) {
  const pos = reverse ? v < 0 : v > 0;
  const neg = reverse ? v > 0 : v < 0;
  if (pos) return "text-emerald-400";
  if (neg) return "text-rose-400";
  return "text-slate-400";
}
function rsColor(v: number) {
  if (v >= 80) return "text-emerald-400 font-semibold";
  if (v >= 60) return "text-emerald-300";
  if (v <= 20) return "text-rose-400 font-semibold";
  if (v <= 40) return "text-rose-300";
  return "text-slate-400";
}
function betaColor(v: number) {
  if (v > 2) return "text-rose-400";
  if (v > 1.5) return "text-amber-400";
  if (v < 0.5) return "text-slate-500";
  return "text-slate-300";
}
function thetaColor(v: number) {
  if (v >= 75) return "text-emerald-400";
  if (v >= 50) return "text-emerald-300/70";
  if (v <= 25) return "text-rose-400";
  if (v <= 40) return "text-rose-300/70";
  return "text-slate-400";
}
function stochColor(v: number) {
  if (v <= 20) return "text-emerald-400 bg-emerald-400/10";
  if (v >= 80) return "text-rose-400 bg-rose-400/10";
  return "text-slate-400";
}
function wRColor(v: number) {
  if (v >= -20) return "text-rose-400 bg-rose-400/10";
  if (v <= -80) return "text-emerald-400 bg-emerald-400/10";
  return "text-slate-400";
}

const DIR_COLORS = {
  BUY:  { pill: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", bar: "bg-emerald-500" },
  SELL: { pill: "bg-rose-500/15 text-rose-400 border-rose-500/30",         bar: "bg-rose-500" },
  HOLD: { pill: "bg-slate-500/15 text-slate-400 border-slate-500/30",      bar: "bg-slate-500" },
};

interface IndicatorSnapshot {
  rs: number;
  rsi: number;
  macdHistogram: number;
  alphaScore: number;
  betaScore: number;
  gammaScore: number;
  thetaScore: number;
  stochK: number;
  wR: number;
  momentumRoc: number;
  atrPct: number;
  isLive: boolean;
}

function hash01(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function estimateIndicators(signal: StockSignal): IndicatorSnapshot {
  const seed = hash01(`${signal.symbol}-${signal.assetClass}`);
  const bias = signal.direction === "BUY" ? 1 : signal.direction === "SELL" ? -1 : 0;
  const strength = Math.max(signal.bullStrength, signal.bearStrength) / 100;
  const volBase = signal.volatility === "HIGH" ? 2.1 : signal.volatility === "LOW" ? 0.7 : 1.2;

  return {
    rs: Math.round(Math.min(100, Math.max(0, 50 + bias * signal.confidence * 0.45 + (seed - 0.5) * 20))),
    rsi: Math.round((50 + bias * strength * 24 + (seed - 0.5) * 12) * 10) / 10,
    macdHistogram: Math.round((bias * strength * 0.9 + (seed - 0.5) * 0.18) * 10000) / 10000,
    alphaScore: Math.round(Math.min(100, Math.max(-100, bias * signal.confidence * 0.8 + (seed - 0.5) * 18))),
    betaScore: Math.round((volBase + seed * 0.45) * 100) / 100,
    gammaScore: Math.round((bias * strength * 12 + (seed - 0.5) * 6) * 10) / 10,
    thetaScore: Math.round(Math.min(100, Math.max(0, 45 + strength * 40 + bias * 8 + (seed - 0.5) * 16))),
    stochK: Math.round(Math.min(100, Math.max(0, 50 + bias * strength * 35 + (seed - 0.5) * 22))),
    wR: Math.round(Math.min(0, Math.max(-100, -50 + bias * strength * 35 + (seed - 0.5) * 22))),
    momentumRoc: Math.round((bias * strength * 8 + (seed - 0.5) * 2) * 100) / 100,
    atrPct: Math.round((volBase + seed * 0.7) * 100) / 100,
    isLive: false,
  };
}

function snapshotFromLive(live: RealSignal): IndicatorSnapshot {
  return {
    rs: live.rs,
    rsi: live.rsi,
    macdHistogram: live.macdHistogram,
    alphaScore: live.alphaScore,
    betaScore: live.betaScore,
    gammaScore: live.gammaScore,
    thetaScore: live.thetaScore,
    stochK: live.stochK,
    wR: live.wR,
    momentumRoc: live.momentumRoc,
    atrPct: live.currentPrice > 0 ? (live.atr / live.currentPrice) * 100 : 0,
    isLive: true,
  };
}

function indicatorsFor(signal: StockSignal, live: RealSignal | undefined) {
  return live ? snapshotFromLive(live) : estimateIndicators(signal);
}

/* ── Mini bar ───────────────────────────────────────────── */
function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="h-1 w-12 rounded-full bg-white/8">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="font-mono text-xs tabular-nums text-slate-500 w-6 text-right">{value}</span>
    </div>
  );
}

/* ── Cell renderer ──────────────────────────────────────── */
function LiveCell({ data, col }: { data: IndicatorSnapshot; col: Col }) {
  const { key } = col;
  const opacity = data.isLive ? "" : "opacity-70";
  if (key === "rs")     return <span className={cn("font-mono text-xs tabular-nums rounded px-1", opacity, rsColor(data.rs))}>{data.rs}</span>;
  if (key === "rsi")    return <span className={cn("font-mono text-xs tabular-nums rounded px-1", opacity, rsiColor(data.rsi))}>{data.rsi.toFixed(1)}</span>;
  if (key === "macd")   return <span className={cn("font-mono text-xs tabular-nums", opacity, signColor(data.macdHistogram))}>{data.macdHistogram > 0 ? "+" : ""}{data.macdHistogram.toFixed(4)}</span>;
  if (key === "alpha")  return <span className={cn("font-mono text-xs tabular-nums", opacity, signColor(data.alphaScore))}>{data.alphaScore > 0 ? "+" : ""}{data.alphaScore}</span>;
  if (key === "beta")   return <span className={cn("font-mono text-xs tabular-nums", opacity, betaColor(data.betaScore))}>{data.betaScore.toFixed(2)}</span>;
  if (key === "gamma")  return <span className={cn("font-mono text-xs tabular-nums", opacity, signColor(data.gammaScore))}>{data.gammaScore > 0 ? "+" : ""}{data.gammaScore.toFixed(1)}</span>;
  if (key === "theta")  return <span className={cn("font-mono text-xs tabular-nums", opacity, thetaColor(data.thetaScore))}>{data.thetaScore}%</span>;
  if (key === "stochK") return <span className={cn("font-mono text-xs tabular-nums rounded px-1", opacity, stochColor(data.stochK))}>{data.stochK}</span>;
  if (key === "wR")     return <span className={cn("font-mono text-xs tabular-nums rounded px-1", opacity, wRColor(data.wR))}>{data.wR}</span>;
  if (key === "roc")    return <span className={cn("font-mono text-xs tabular-nums", opacity, signColor(data.momentumRoc))}>{data.momentumRoc > 0 ? "+" : ""}{data.momentumRoc.toFixed(2)}%</span>;
  if (key === "atr") {
    return <span className={cn("font-mono text-xs tabular-nums text-slate-400", opacity)}>{data.atrPct.toFixed(2)}%</span>;
  }
  return <span className="text-slate-700 font-mono text-xs">—</span>;
}

/* ── Tooltip ─────────────────────────────────────────────── */
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-[10px] leading-snug text-slate-300 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 max-w-[200px] whitespace-normal text-center">
        {text}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
interface Props {
  signals: StockSignal[];
  selected: StockSignal | null;
  onSelect: (s: StockSignal) => void;
}

export function TerminalView({ signals, selected, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("confidence");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [liveData, setLiveData] = useState<Map<string, RealSignal>>(new Map(liveCache));
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set());

  /* Fetch live indicators only for the selected row. Bulk prefetching causes provider rate limits. */
  useEffect(() => {
    if (!selected) return;
    const sym = selected.symbol;
    if (liveCache.has(sym)) {
      setLiveData((prev) => new Map([...prev, [sym, liveCache.get(sym)!]]));
      return;
    }

    const controller = new AbortController();
    setLoadingSet((prev) => new Set([...prev, sym]));
    fetch(`/api/signal/${sym}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: RealSignal) => {
        if (!data.error) {
          liveCache.set(sym, data);
          setLiveData((prev) => new Map([...prev, [sym, data]]));
        }
      })
      .catch(() => {/* the detail panel shows any selected-symbol error */})
      .finally(() => {
        setLoadingSet((prev) => {
          const next = new Set(prev);
          next.delete(sym);
          return next;
        });
      });

    return () => controller.abort();
  }, [selected]);

  /* ── Sorting ──────────────────────────────────────────── */
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...signals].sort((a, b) => {
    const la = liveData.get(a.symbol);
    const lb = liveData.get(b.symbol);
    let va: number;
    let vb: number;
    if (sortKey === "confidence") { va = a.confidence; vb = b.confidence; }
    else if (sortKey === "symbol") { return sortDir === "asc" ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol); }
    else {
      const getVal = (signal: StockSignal, live: RealSignal | undefined): number => {
        const data = indicatorsFor(signal, live);
        if (sortKey === "rs")     return data.rs;
        if (sortKey === "rsi")    return data.rsi;
        if (sortKey === "macd")   return data.macdHistogram;
        if (sortKey === "alpha")  return data.alphaScore;
        if (sortKey === "beta")   return data.betaScore;
        if (sortKey === "gamma")  return data.gammaScore;
        if (sortKey === "theta")  return data.thetaScore;
        if (sortKey === "stochK") return data.stochK;
        if (sortKey === "wR")     return data.wR;
        if (sortKey === "roc")    return data.momentumRoc;
        if (sortKey === "atr")    return data.atrPct;
        return 0;
      };
      va = getVal(a, la);
      vb = getVal(b, lb);
    }
    return sortDir === "desc" ? vb - va : va - vb;
  });

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-0.5 inline-flex flex-col leading-none">
      <ChevronUp   className={cn("h-2.5 w-2.5", sortKey === k && sortDir === "asc"  ? "text-amber-400" : "text-slate-700")} />
      <ChevronDown className={cn("h-2.5 w-2.5", sortKey === k && sortDir === "desc" ? "text-amber-400" : "text-slate-700")} />
    </span>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* legend */}
      <div className="flex shrink-0 items-center gap-4 border-b border-white/6 bg-slate-950/60 px-4 py-1.5 text-[10px] text-slate-600">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-400/30" /> Bullish signal</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-rose-400/30" /> Bearish signal</span>
        <span className="ml-auto text-slate-700">Dim values are model estimates · click a row to upgrade it with live bars · no bulk provider polling</span>
      </div>

      {/* table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full border-collapse text-xs" style={{ minWidth: "1100px" }}>
          <thead className="sticky top-0 z-10 bg-slate-950 border-b border-white/8">
            <tr>
              {/* Fixed left columns */}
              <th className="sticky left-0 z-20 bg-slate-950 border-r border-white/6 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-20">
                <button onClick={() => handleSort("symbol")} className="flex items-center gap-0.5 hover:text-white transition">
                  Ticker <SortIcon k="symbol" />
                </button>
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-40">Name</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-28">Class</th>
              <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-16">Dir</th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-20">
                <button onClick={() => handleSort("confidence")} className="flex items-center gap-0.5 ml-auto hover:text-white transition">
                  Conf% <SortIcon k="confidence" />
                </button>
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-32">Bull / Bear</th>
              <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-16">Vol</th>
              {/* Live indicator columns */}
              {COLS.map((col) => (
                <th key={col.key} className={cn("px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500", col.width)}>
                  <Tooltip text={col.tooltip}>
                    <button onClick={() => handleSort(col.key)} className="flex items-center gap-0.5 hover:text-white transition w-full justify-end">
                      <span className="text-amber-400/80">{col.abbr}</span>
                      <SortIcon k={col.key} />
                    </button>
                  </Tooltip>
                </th>
              ))}
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Trigger</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((sig, idx) => {
              const live = liveData.get(sig.symbol);
              const indicators = indicatorsFor(sig, live);
              const isLoading = loadingSet.has(sig.symbol);
              const isSelected = selected?.symbol === sig.symbol && selected?.assetClass === sig.assetClass;
              const dc = DIR_COLORS[sig.direction];
              return (
                <tr
                  key={`${sig.symbol}-${sig.assetClass}`}
                  onClick={() => onSelect(sig)}
                  className={cn(
                    "group cursor-pointer border-b border-white/4 transition-colors",
                    isSelected
                      ? "bg-amber-400/8 border-amber-400/20"
                      : idx % 2 === 0
                        ? "bg-slate-950 hover:bg-white/3"
                        : "bg-slate-900/30 hover:bg-white/3"
                  )}
                >
                  {/* Ticker */}
                  <td className={cn(
                    "sticky left-0 z-10 border-r border-white/4 px-3 py-2 font-mono font-bold text-xs",
                    isSelected ? "bg-amber-400/8" : idx % 2 === 0 ? "bg-slate-950" : "bg-slate-900/40",
                    sig.direction === "BUY" ? "text-emerald-300" : sig.direction === "SELL" ? "text-rose-300" : "text-slate-300"
                  )}>
                    <span className="flex items-center gap-1">
                      {sig.direction === "BUY"  && <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />}
                      {sig.direction === "SELL" && <TrendingDown className="h-3 w-3 text-rose-400 shrink-0" />}
                      {sig.direction === "HOLD" && <Minus className="h-3 w-3 text-slate-500 shrink-0" />}
                      {sig.symbol}
                      {isLoading && <span className="h-1 w-1 rounded-full bg-amber-400 animate-pulse shrink-0" />}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="px-3 py-2 text-slate-400 max-w-[160px] truncate">{sig.name}</td>

                  {/* Asset class */}
                  <td className="px-3 py-2 text-slate-500">{sig.assetClass}</td>

                  {/* Direction pill */}
                  <td className="px-3 py-2 text-center">
                    <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wider", dc.pill)}>
                      {sig.direction}
                    </span>
                  </td>

                  {/* Confidence */}
                  <td className="px-3 py-2 text-right">
                    <span className={cn(
                      "font-mono font-semibold text-xs tabular-nums",
                      sig.confidence >= 80 ? "text-emerald-400" : sig.confidence >= 70 ? "text-amber-300" : "text-slate-300"
                    )}>
                      {sig.confidence}%
                    </span>
                  </td>

                  {/* Bull / Bear mini bars */}
                  <td className="px-2 py-2 space-y-0.5">
                    <MiniBar value={sig.bullStrength} color="bg-emerald-500" />
                    <MiniBar value={sig.bearStrength} color="bg-rose-500" />
                  </td>

                  {/* Volatility */}
                  <td className="px-3 py-2 text-center">
                    <span className={cn(
                      "text-[9px] font-bold tracking-wider",
                      sig.volatility === "HIGH" ? "text-rose-400" : sig.volatility === "LOW" ? "text-emerald-400" : "text-amber-300"
                    )}>
                      {sig.volatility}
                    </span>
                  </td>

                  {/* Live indicator columns */}
                  {COLS.map((col) => (
                    <td key={col.key} className="px-2 py-2 text-right whitespace-nowrap">
                      <LiveCell data={indicators} col={col} />
                    </td>
                  ))}

                  {/* Trigger */}
                  <td className="px-3 py-2 text-slate-500 max-w-[260px]">
                    <span className="flex items-start gap-1 leading-snug">
                      <Zap className="mt-0.5 h-3 w-3 shrink-0 text-amber-400/60" />
                      <span className="truncate">{sig.trigger.headline}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="flex h-32 items-center justify-center text-slate-600 text-sm">
            No signals match the current filters
          </div>
        )}
      </div>
    </div>
  );
}
