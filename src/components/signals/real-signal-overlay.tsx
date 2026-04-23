"use client";

import type { RealSignal } from "@/app/api/signal/[symbol]/route";
import type { StockSignal } from "@/types/signals";
import { DIRECTION_COLOR, VOLATILITY_COLOR } from "@/types/signals";
import { cn } from "@/lib/cn";
import {
  TrendingUp, TrendingDown, Info, Zap, X,
  BarChart2, Activity, RefreshCw, AlertTriangle,
} from "lucide-react";

function Chip({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-slate-950/60 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn("mt-0.5 font-mono text-sm font-semibold", accent ?? "text-white")}>{value}</p>
    </div>
  );
}

function VoteBar({ label, vote, weight }: { label: string; vote: string; weight: number }) {
  const col = vote === "BUY" ? "bg-emerald-500" : vote === "SELL" ? "bg-rose-500" : "bg-slate-500";
  const text = vote === "BUY" ? "text-emerald-300" : vote === "SELL" ? "text-rose-300" : "text-slate-400";
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-[11px] text-slate-400 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-800">
        <div className={cn("h-1.5 rounded-full", col)} style={{ width: `${(weight / 2.5) * 100}%` }} />
      </div>
      <span className={cn("w-9 text-right text-[11px] font-bold shrink-0", text)}>{vote}</span>
    </div>
  );
}

export function RealSignalOverlay({
  real,
  base,
  onClose,
}: {
  real: RealSignal;
  base: StockSignal;
  onClose: () => void;
}) {
  const dir = real.direction;
  const dc = DIRECTION_COLOR[dir];
  const vc = VOLATILITY_COLOR[base.volatility];
  const dirIcon = dir === "BUY"
    ? <TrendingUp className="h-4 w-4 text-emerald-400" />
    : dir === "SELL"
    ? <TrendingDown className="h-4 w-4 text-rose-400" />
    : <Activity className="h-4 w-4 text-slate-400" />;

  const fmt = (n: number, dp = 2) => n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

  const rsiColor = real.rsi < 30
    ? "text-emerald-300"
    : real.rsi > 70
    ? "text-rose-300"
    : "text-slate-200";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      {/* accent bar */}
      <div className={cn("h-1 w-full shrink-0",
        dir === "BUY" ? "bg-emerald-500" : dir === "SELL" ? "bg-rose-500" : "bg-slate-500")} />

      {/* header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/8 px-5 py-4 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {dirIcon}
            <span className="font-mono text-xl font-bold text-white">{real.symbol}</span>
            <span className={cn("rounded border px-1.5 py-0.5 text-xs font-bold tracking-wide", dc)}>
              {dir}
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
              <Activity className="h-2.5 w-2.5" /> Live data
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-300">{base.name}</p>
          <p className="text-xs text-slate-500">{base.sector} · {base.subIndustry}</p>
        </div>
        <button onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* confidence */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/8 bg-slate-950/60 p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Confidence</p>
            <p className={cn("mt-1 text-4xl font-bold tabular-nums",
              dir === "BUY" ? "text-emerald-300" : dir === "SELL" ? "text-rose-300" : "text-slate-300")}>
              {real.confidence}%
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">from {real.dataPoints} daily bars</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-slate-950/60 p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Uncertainty</p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-amber-300">{real.uncertainty}%</p>
          </div>
        </div>

        {/* bull/bear */}
        <div className="rounded-xl border border-white/8 bg-slate-950/40 p-4 space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Strength</p>
          {[
            { label: "Bullish", value: real.bullStrength, color: "bg-emerald-500" },
            { label: "Bearish", value: real.bearStrength, color: "bg-rose-500" },
          ].map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{r.label} Strength</span>
                <span className="tabular-nums text-slate-300">{r.value}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className={cn("h-2 rounded-full", r.color)} style={{ width: `${r.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* indicator breakdown */}
        <div className="rounded-xl border border-white/8 bg-slate-950/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="h-3.5 w-3.5 text-cyan-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Indicator votes (real computed)
            </p>
          </div>
          <div className="space-y-2">
            {real.indicatorVotes.map((v) => (
              <VoteBar key={v.label} label={v.label} vote={v.vote} weight={v.weight} />
            ))}
          </div>
        </div>

        {/* raw indicator values */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Raw indicator values
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Chip label="Current price" value={`$${fmt(real.currentPrice)}`} />
            <Chip label="RSI (14)" value={real.rsi.toFixed(1)}
              accent={real.rsi < 30 ? "text-emerald-300" : real.rsi > 70 ? "text-rose-300" : rsiColor} />
            <Chip label="MACD Histogram" value={real.macdHistogram.toFixed(4)}
              accent={real.macdHistogram > 0 ? "text-emerald-300" : "text-rose-300"} />
            <Chip label="Momentum ROC" value={`${real.momentumRoc.toFixed(2)}%`}
              accent={real.momentumRoc > 0 ? "text-emerald-300" : "text-rose-300"} />
            <Chip label="EMA 20" value={`$${fmt(real.ema20)}`} />
            <Chip label="EMA 50" value={`$${fmt(real.ema50)}`} />
          </div>
        </div>

        {/* trade setup from real ATR */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Trade structure (2×ATR stop · 5×ATR target)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Chip label="Entry" value={`$${fmt(real.trade.entry)}`} accent="text-cyan-300" />
            <Chip label="Stop Loss" value={`$${fmt(real.trade.stopLoss)}`} accent="text-rose-300" />
            <Chip label="Target" value={`$${fmt(real.trade.target)}`} accent="text-emerald-300" />
            <Chip label="Risk / Reward" value={`${real.trade.riskReward.toFixed(1)}×`} accent="text-amber-300" />
            <Chip label="ATR (daily)" value={`${real.trade.atrDaily}%`} accent="text-amber-200" />
            <Chip label="Max position" value={`${real.trade.maxPosition.toFixed(1)}%`} />
          </div>
        </div>

        {/* geo trigger from static model */}
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
            Severity {base.trigger.severity}/100
          </p>
        </div>

        {/* data freshness */}
        <div className="rounded-lg border border-white/5 bg-slate-950/30 p-3 flex items-start gap-2">
          <RefreshCw className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-600" />
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Data from Yahoo Finance · {real.dataPoints} bars · fetched{" "}
            {new Date(real.fetchedAt).toLocaleTimeString()} · cached 4 h.
          </p>
        </div>

        <div className="rounded-lg border border-white/5 bg-slate-950/20 p-3 flex gap-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-600" />
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Technical signals are computed from real historical OHLCV data but are for educational
            purposes only — not financial advice. RSI, MACD, EMA, and momentum do not guarantee
            future price movements. Always do your own research.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── loading skeleton ── */
export function RealSignalSkeleton({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      <div className="h-1 w-full shrink-0 bg-slate-700 animate-pulse" />
      <div className="flex items-start justify-between gap-3 border-b border-white/8 px-5 py-4 shrink-0">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 rounded bg-slate-800 animate-pulse" />
            <div className="h-5 w-12 rounded bg-slate-800 animate-pulse" />
            <div className="h-4 w-20 rounded bg-emerald-900/40 animate-pulse" />
          </div>
          <div className="h-3 w-40 rounded bg-slate-800 animate-pulse" />
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-xl bg-slate-800/50 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-800/50 animate-pulse" />
        </div>
        <div className="h-32 rounded-xl bg-slate-800/40 animate-pulse" />
        <div className="h-40 rounded-xl bg-slate-800/40 animate-pulse" />
        <p className="text-center text-xs text-slate-500 animate-pulse">
          Fetching real market data for {symbol} from Yahoo Finance…
        </p>
      </div>
    </div>
  );
}

/* ── error state ── */
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

/* ── rate-limited state ── */
export function RealSignalRateLimited({
  symbol,
  retryAfter,
  onClose,
}: {
  symbol: string;
  retryAfter: number;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-amber-500/20 bg-slate-900 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
        <RefreshCw className="h-6 w-6 text-amber-400 animate-spin" style={{ animationDuration: "2s" }} />
      </div>
      <div>
        <p className="font-mono text-lg font-bold text-white">{symbol}</p>
        <p className="mt-1 text-sm font-medium text-amber-300">Yahoo Finance rate limit hit</p>
        <p className="mt-2 text-xs text-slate-400 max-w-xs leading-relaxed">
          Our server is temporarily throttled by Yahoo Finance. This is normal during high-traffic
          testing. The limit resets in ~{retryAfter}s — click retry or wait a moment.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition"
        >
          Retry
        </button>
        <button onClick={onClose}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:text-white transition">
          Close
        </button>
      </div>
      <p className="text-[10px] text-slate-600">
        Technical analysis engine is built · RSI · MACD · EMA · ATR · Momentum
      </p>
    </div>
  );
}
