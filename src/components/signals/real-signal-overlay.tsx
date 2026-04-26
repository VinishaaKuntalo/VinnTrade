"use client";

import { useState } from "react";
import type { RealSignal } from "@/app/api/signal/[symbol]/route";
import type { StockSignal } from "@/types/signals";
import { DIRECTION_COLOR, VOLATILITY_COLOR, GEO_SENSITIVITY_LABEL } from "@/types/signals";
import { cn } from "@/lib/cn";
import {
  TrendingUp, TrendingDown, Activity, Info, Zap, X,
  BarChart2, Brain, Clock, ShieldCheck, RefreshCw,
  AlertTriangle,
} from "lucide-react";

type Tab = "trade" | "reasoning" | "timeline" | "reliability";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "trade",      label: "TRADE SETUP",  icon: <Zap        className="h-3 w-3" /> },
  { id: "reasoning",  label: "AI REASONING", icon: <Brain      className="h-3 w-3" /> },
  { id: "timeline",   label: "TIMELINE",     icon: <Clock      className="h-3 w-3" /> },
  { id: "reliability",label: "RELIABILITY",  icon: <ShieldCheck className="h-3 w-3" /> },
];

function DataBox({ label, value, accent, sub }: { label: string; value: string; accent?: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/6 bg-slate-950/70 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn("mt-0.5 font-mono text-sm font-semibold", accent ?? "text-white")}>{value}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function VoteRow({ label, vote, weight }: { label: string; vote: string; weight: number }) {
  const col = vote === "BUY" ? "bg-emerald-500" : vote === "SELL" ? "bg-rose-500" : "bg-slate-500";
  const text = vote === "BUY" ? "text-emerald-300" : vote === "SELL" ? "text-rose-300" : "text-slate-400";
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-[11px] text-slate-400">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={cn("h-1.5 rounded-full", col)} style={{ width: `${(weight / 2.5) * 100}%` }} />
      </div>
      <span className={cn("w-9 shrink-0 text-right text-[11px] font-bold", text)}>{vote}</span>
    </div>
  );
}

/* ── TAB: Trade ── */
function TradeTab({ real }: { real: RealSignal }) {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const t = real.trade;
  const riskPct = ((Math.abs(t.entry - t.stopLoss) / t.entry) * 100).toFixed(2);
  const rewardPct = ((Math.abs(t.target - t.entry) / t.entry) * 100).toFixed(2);

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Trade structure · 2×ATR stop · 5×ATR target
      </p>
      <div className="grid grid-cols-2 gap-2">
        <DataBox label="Current price" value={`$${fmt(real.currentPrice)}`} sub={`from ${real.dataPoints} bars`} />
        <DataBox label="Entry"         value={`$${fmt(t.entry)}`}           accent="text-cyan-300" />
        <DataBox label="Stop loss"     value={`$${fmt(t.stopLoss)}`}        accent="text-rose-300" />
        <DataBox label="Target"        value={`$${fmt(t.target)}`}          accent="text-emerald-300" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <DataBox label="Risk / Reward" value={`${t.riskReward.toFixed(1)}×`} accent="text-amber-300" />
        <DataBox label="ATR (daily)"   value={`${t.atrDaily}%`}              accent="text-amber-200" />
        <DataBox label="Max position"  value={`${t.maxPosition.toFixed(1)}%`} />
      </div>
      <div className="rounded-lg border border-white/6 bg-slate-950/40 p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Risk vs reward
        </p>
        <div className="flex h-4 overflow-hidden rounded-full">
          <div
            className="h-full bg-rose-500/70 flex items-center justify-center"
            style={{ width: `${(1 / (1 + t.riskReward)) * 100}%` }}
          >
            <span className="text-[9px] font-bold text-white px-1">-{riskPct}%</span>
          </div>
          <div
            className="h-full bg-emerald-500/70 flex items-center justify-center"
            style={{ width: `${(t.riskReward / (1 + t.riskReward)) * 100}%` }}
          >
            <span className="text-[9px] font-bold text-white px-1">+{rewardPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── TAB: AI Reasoning (indicator votes + geo context) ── */
function ReasoningTab({ real, base }: { real: RealSignal; base: StockSignal }) {
  const geoLabel = GEO_SENSITIVITY_LABEL[base.geoSensitivity];
  const rsiState = real.rsi < 30 ? "oversold (bullish)" : real.rsi > 70 ? "overbought (bearish)" : "neutral";

  return (
    <div className="space-y-4">
      {/* indicator votes */}
      <div className="rounded-xl border border-white/8 bg-slate-950/40 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="h-3.5 w-3.5 text-cyan-400" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Indicator votes · real computed
          </p>
        </div>
        <div className="space-y-2">
          {real.indicatorVotes.map((v) => (
            <VoteRow key={v.label} label={v.label} vote={v.vote} weight={v.weight} />
          ))}
        </div>
      </div>

      {/* technical context */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Technical context
        </p>
        <div className="space-y-2">
          {[
            { label: `RSI (14)`, value: real.rsi.toFixed(1), note: rsiState },
            { label: `MACD histogram`, value: real.macdHistogram.toFixed(4), note: real.macdHistogram > 0 ? "positive — momentum building" : "negative — momentum fading" },
            { label: `Momentum ROC`, value: `${real.momentumRoc.toFixed(2)}%`, note: real.momentumRoc > 0 ? "positive drift" : "negative drift" },
            { label: `EMA 20 vs 50`, value: real.ema20 > real.ema50 ? "20 > 50 ↑" : "20 < 50 ↓", note: real.ema20 > real.ema50 ? "short-term above long-term (bullish)" : "short-term below long-term (bearish)" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between gap-3 rounded-lg border border-white/5 bg-slate-950/30 px-3 py-2">
              <div>
                <p className="text-[11px] font-medium text-slate-300">{row.label}</p>
                <p className="text-[10px] text-slate-600">{row.note}</p>
              </div>
              <p className="font-mono text-sm font-semibold text-white shrink-0">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* geo context */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
            Geopolitical context
          </p>
          <span className="ml-auto text-[10px] text-slate-500">{base.trigger.timeAgo}</span>
        </div>
        <p className="text-sm font-medium text-amber-100/90">{base.trigger.headline}</p>
        <p className="mt-1 text-[11px] text-slate-500">
          {geoLabel} · Severity {base.trigger.severity}/100
        </p>
      </div>
    </div>
  );
}

/* ── TAB: Timeline ── */
function TimelineTab({ real, base }: { real: RealSignal; base: StockSignal }) {
  const fetchedAt = new Date(real.fetchedAt);
  const events = [
    {
      time: base.trigger.timeAgo,
      label: "Triggering event",
      detail: base.trigger.headline,
      color: "bg-amber-400",
      textColor: "text-amber-300",
    },
    {
      time: fetchedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      label: "Data fetched from Stooq",
      detail: `${real.dataPoints} daily OHLCV bars · RSI · MACD · EMA · ATR computed`,
      color: "bg-cyan-400",
      textColor: "text-cyan-300",
    },
    {
      time: "Live",
      label: "Signal active",
      detail: `${real.direction} · ${real.confidence}% confidence · cached 4h`,
      color: real.direction === "BUY" ? "bg-emerald-400" : real.direction === "SELL" ? "bg-rose-400" : "bg-slate-400",
      textColor: real.direction === "BUY" ? "text-emerald-300" : real.direction === "SELL" ? "text-rose-300" : "text-slate-300",
    },
    {
      time: `+${base.timeframe === "Intraday" ? "1d" : base.timeframe === "Short-term" ? "2–4w" : base.timeframe === "Medium-term" ? "1–3m" : "3–12m"}`,
      label: "Expected resolution",
      detail: `${base.timeframe} horizon — monitor for thesis confirmation or invalidation`,
      color: "bg-slate-600",
      textColor: "text-slate-400",
    },
  ];

  return (
    <div className="space-y-1">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Event timeline
      </p>
      <div className="relative pl-5">
        <div className="absolute left-1.5 top-1 bottom-1 w-px bg-white/8" />
        <div className="space-y-5">
          {events.map((ev, i) => (
            <div key={i} className="relative">
              <span className={cn("absolute -left-[18px] top-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950", ev.color)} />
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className={cn("text-[10px] font-mono font-semibold", ev.textColor)}>{ev.time}</span>
                <span className="text-[10px] font-semibold text-slate-400">{ev.label}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{ev.detail}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-white/5 bg-slate-950/30 p-3">
        <RefreshCw className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-600" />
        <p className="text-[10px] text-slate-600 leading-relaxed">
          Stooq data · {real.dataSource} · fetched {fetchedAt.toLocaleTimeString()} · server-cached 4h
        </p>
      </div>
    </div>
  );
}

/* ── TAB: Reliability ── */
function ReliabilityTab({ real, base }: { real: RealSignal; base: StockSignal }) {
  const score = Math.round(real.confidence * 0.6 + (100 - real.uncertainty) * 0.4);
  const rsiColor = real.rsi < 30 ? "text-emerald-300" : real.rsi > 70 ? "text-rose-300" : "text-slate-300";

  return (
    <div className="space-y-4">
      {/* score */}
      <div className="flex items-center gap-4 rounded-xl border border-white/8 bg-slate-950/60 p-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="rgb(30 41 59)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="14"
              fill="none"
              stroke={score > 70 ? "rgb(52 211 153)" : score > 50 ? "rgb(251 191 36)" : "rgb(248 113 113)"}
              strokeWidth="3"
              strokeDasharray={`${(score / 100) * 87.96} 87.96`}
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm font-bold tabular-nums text-white">{score}</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-200">Reliability score</p>
          <p className="text-[11px] text-slate-400">Based on {real.dataPoints} real OHLCV bars</p>
          <p className={cn("mt-1 text-[10px] font-bold uppercase tracking-wider",
            score > 70 ? "text-emerald-400" : score > 50 ? "text-amber-400" : "text-rose-400")}>
            {score > 70 ? "High reliability" : score > 50 ? "Moderate reliability" : "Low reliability"}
          </p>
        </div>
      </div>

      {/* raw values */}
      <div className="grid grid-cols-2 gap-2">
        <DataBox label="Confidence"    value={`${real.confidence}%`}
          accent={real.direction === "BUY" ? "text-emerald-300" : real.direction === "SELL" ? "text-rose-300" : "text-slate-300"} />
        <DataBox label="Uncertainty"   value={`${real.uncertainty}%`} accent="text-amber-300" />
        <DataBox label="RSI (14)"      value={real.rsi.toFixed(1)}   accent={rsiColor} sub={real.rsi < 30 ? "Oversold" : real.rsi > 70 ? "Overbought" : "Neutral"} />
        <DataBox label="MACD Hist."    value={real.macdHistogram.toFixed(4)}
          accent={real.macdHistogram > 0 ? "text-emerald-300" : "text-rose-300"} />
        <DataBox label="EMA 20"        value={`$${real.ema20.toFixed(2)}`} />
        <DataBox label="EMA 50"        value={`$${real.ema50.toFixed(2)}`} />
      </div>

      {/* disclaimer */}
      <div className="flex gap-2 rounded-lg border border-white/5 bg-slate-950/20 p-3">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-600" />
        <p className="text-[10px] text-slate-600 leading-relaxed">
          Technical signals computed from real historical OHLCV data — educational purposes only, not financial advice. RSI, MACD, EMA, and momentum do not guarantee future price movements.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Main overlay — real market data
══════════════════════════════════════════════════════════ */
export function RealSignalOverlay({
  real,
  base,
  onClose,
}: {
  real: RealSignal;
  base: StockSignal;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("trade");
  const dir = real.direction;
  const dc = DIRECTION_COLOR[dir];
  const vc = VOLATILITY_COLOR[base.volatility];
  const dirIcon =
    dir === "BUY" ? <TrendingUp className="h-4 w-4 text-emerald-400" />
    : dir === "SELL" ? <TrendingDown className="h-4 w-4 text-rose-400" />
    : <Activity className="h-4 w-4 text-slate-400" />;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      {/* accent bar */}
      <div className={cn("h-1 w-full shrink-0",
        dir === "BUY" ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
        : dir === "SELL" ? "bg-gradient-to-r from-rose-500 to-orange-500"
        : "bg-slate-600")} />

      {/* ── HEADER ── */}
      <div className="shrink-0 border-b border-white/8 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {dirIcon}
              <span className="font-mono text-2xl font-bold text-white">{real.symbol}</span>
              <span className={cn("rounded border px-1.5 py-0.5 text-xs font-bold tracking-wider", dc)}>
                {dir}
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                <Activity className="h-2.5 w-2.5" /> Live data
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-300">{base.name}</p>
            <p className="text-xs text-slate-500">{base.sector} · {base.assetClass}</p>
          </div>
          {/* confidence */}
          <div className="shrink-0 text-right">
            <p className={cn("text-4xl font-bold tabular-nums leading-none",
              dir === "BUY" ? "text-emerald-300" : dir === "SELL" ? "text-rose-300" : "text-slate-300")}>
              {real.confidence}%
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">confidence</p>
            <p className="mt-1 text-sm font-semibold text-amber-300 tabular-nums">{real.uncertainty}%</p>
            <p className="text-[10px] text-slate-600">uncertainty</p>
            <button onClick={onClose}
              className="mt-2 rounded-lg p-1 text-slate-500 hover:bg-white/8 hover:text-white transition"
              aria-label="Close">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* bull / bear bars */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-emerald-400/80">Bullish Strength</span>
              <span className="tabular-nums text-slate-400">{real.bullStrength}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${real.bullStrength}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-rose-400/80">Bearish Strength</span>
              <span className="tabular-nums text-slate-400">{real.bearStrength}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-1.5 rounded-full bg-rose-500" style={{ width: `${real.bearStrength}%` }} />
            </div>
          </div>
        </div>

        {/* tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium", vc)}>
            {base.volatility} VOLATILITY
          </span>
          <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
            {base.timeframe}
          </span>
          {base.tags.map((t) => (
            <span key={t} className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">{t}</span>
          ))}
        </div>

        {/* triggering event */}
        <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/80">
              Triggering Event
            </span>
            <span className="ml-auto text-[10px] text-slate-500">{base.trigger.timeAgo}</span>
          </div>
          <p className="text-xs font-medium text-slate-200 leading-snug">{base.trigger.headline}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {GEO_SENSITIVITY_LABEL[base.trigger.category]} · Severity {base.trigger.severity}/100
          </p>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex shrink-0 border-b border-white/8">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition",
              tab === t.id
                ? "border-b-2 border-cyan-400 text-cyan-300"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "trade"       && <TradeTab       real={real} />}
        {tab === "reasoning"   && <ReasoningTab   real={real} base={base} />}
        {tab === "timeline"    && <TimelineTab    real={real} base={base} />}
        {tab === "reliability" && <ReliabilityTab real={real} base={base} />}
      </div>
    </div>
  );
}

/* ── skeleton ── */
export function RealSignalSkeleton({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      <div className="h-1 w-full shrink-0 bg-gradient-to-r from-cyan-600/60 to-slate-700 animate-pulse" />
      <div className="flex items-start justify-between gap-3 border-b border-white/8 px-5 py-4 shrink-0">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-24 rounded-lg bg-slate-700 animate-pulse" />
            <div className="h-5 w-14 rounded bg-slate-700 animate-pulse" />
            <div className="h-4 w-20 rounded bg-slate-700/60 animate-pulse" />
          </div>
          <div className="h-3 w-44 rounded bg-slate-700/70 animate-pulse" />
          <div className="h-3 w-32 rounded bg-slate-700/50 animate-pulse" />
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 p-5 space-y-4 overflow-hidden">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-xl bg-slate-800 animate-pulse" />
          <div className="h-20 rounded-xl bg-slate-800 animate-pulse" />
          <div className="h-20 rounded-xl bg-slate-800 animate-pulse" />
          <div className="h-20 rounded-xl bg-slate-800 animate-pulse" />
        </div>
        <div className="h-2 w-full rounded-full bg-slate-800 animate-pulse" />
        <div className="h-32 rounded-xl bg-slate-800 animate-pulse" />
        <div className="flex items-center justify-center gap-2 pt-2">
          <RefreshCw className="h-3.5 w-3.5 text-slate-600 animate-spin" style={{ animationDuration: "1.5s" }} />
          <p className="text-xs text-slate-600 animate-pulse">
            Fetching from Stooq for <span className="font-mono font-semibold text-slate-500">{symbol}</span>…
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── error ── */
export function RealSignalError({ symbol, message, onClose }: { symbol: string; message: string; onClose: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <div>
        <p className="font-mono font-bold text-white">{symbol}</p>
        <p className="mt-1 text-sm text-slate-400">Could not fetch market data</p>
        <p className="mt-1 text-xs text-slate-600 max-w-xs">{message}</p>
      </div>
      <button onClick={onClose}
        className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:text-white transition">
        Close
      </button>
    </div>
  );
}

/* ── rate limited ── */
export function RealSignalRateLimited({ symbol, countdown, onRetry, onClose }: {
  symbol: string; countdown: number; onRetry: () => void; onClose: () => void;
}) {
  const pct = Math.max(0, Math.min(100, (countdown / 60) * 100));
  const circumference = 2 * Math.PI * 20;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 rounded-2xl border border-amber-500/20 bg-slate-900 p-8 text-center">
      {/* circular countdown ring */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="rgb(30 41 59)" strokeWidth="3" />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="rgb(251 191 36)"
            strokeWidth="3"
            strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <RefreshCw className="h-6 w-6 text-amber-400" />
      </div>

      <div>
        <p className="font-mono text-lg font-bold text-white">{symbol}</p>
        <p className="mt-1 text-sm font-medium text-amber-300">Data fetch timed out</p>
        <p className="mt-2 text-xs text-slate-400 max-w-xs leading-relaxed">
          Auto-retrying in <span className="font-mono font-semibold text-amber-300">{countdown}s</span>
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition"
        >
          Retry now
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:text-white transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
