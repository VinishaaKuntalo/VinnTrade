"use client";

import { useState } from "react";
import type { StockSignal } from "@/types/signals";
import {
  DIRECTION_COLOR,
  VOLATILITY_COLOR,
  GEO_SENSITIVITY_LABEL,
} from "@/types/signals";
import { cn } from "@/lib/cn";
import {
  X,
  Zap,
  TrendingUp,
  TrendingDown,
  Brain,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

type Tab = "trade" | "reasoning" | "timeline" | "reliability";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "trade",     label: "TRADE SETUP",  icon: <Zap       className="h-3 w-3" /> },
  { id: "reasoning", label: "AI REASONING", icon: <Brain     className="h-3 w-3" /> },
  { id: "timeline",  label: "TIMELINE",     icon: <Clock     className="h-3 w-3" /> },
  { id: "reliability",label:"RELIABILITY",  icon: <ShieldCheck className="h-3 w-3" /> },
];

function DataBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-white/6 bg-slate-950/70 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={cn("mt-0.5 font-mono text-sm font-semibold", accent ?? "text-white")}>
        {value}
      </p>
    </div>
  );
}

function StrengthRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-[11px] text-slate-400">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={cn("h-1.5 rounded-full transition-all", color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-slate-300">
        {value}%
      </span>
    </div>
  );
}

function buildReasoning(signal: StockSignal) {
  const dirWord =
    signal.direction === "BUY"
      ? "bullish"
      : signal.direction === "SELL"
      ? "bearish"
      : "neutral";
  const geoLabel = GEO_SENSITIVITY_LABEL[signal.geoSensitivity];
  const highConf = signal.confidence > 62;

  return {
    thesis: `${signal.symbol} presents a ${dirWord} setup driven by ${geoLabel.toLowerCase()} pressures within the ${signal.sector} sector. The demo assigns ${signal.confidence}% agreement (${highConf ? "upper band for this illustrative model" : "typical for this illustrative model"}) — not from live price rules.`,
    points: [
      `The triggering event (${signal.trigger.headline}) scores ${signal.trigger.severity}/100 on severity — ${signal.trigger.severity > 70 ? "a significant catalyst warranting close attention" : "a moderate catalyst that merits monitoring"}.`,
      `${signal.sector} sector dynamics lean ${signal.direction === "BUY" ? "constructive" : signal.direction === "SELL" ? "defensive" : "neutral"} in the current macro regime, supported by the ${geoLabel.toLowerCase()} channel.`,
      `Bull/Bear ratio (${signal.bullStrength}% / ${signal.bearStrength}%) ${signal.bullStrength > signal.bearStrength ? "favours buyers" : signal.bearStrength > signal.bullStrength ? "favours sellers" : "is balanced"}, consistent with the ${signal.direction} signal.`,
    ],
    risks: [
      `Agreement score is ${signal.confidence}% on this demo signal — size defensively; treat as narrative scaffolding, not statistics.`,
      `Geo-political triggers (${geoLabel}) can reverse quickly on diplomatic developments or policy announcements.`,
      `This is a deterministic educational model seeded from sector/sub-industry data — not derived from real-time price feeds.`,
    ],
  };
}

function TradeTab({ signal }: { signal: StockSignal }) {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const t = signal.trade;
  const riskPct = ((Math.abs(t.entry - t.stopLoss) / t.entry) * 100).toFixed(2);
  const rewardPct = ((Math.abs(t.target - t.entry) / t.entry) * 100).toFixed(2);

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Trade structure
      </p>
      <div className="grid grid-cols-2 gap-2">
        <DataBox label="Current price" value={`$${fmt(t.currentPrice)}`} />
        <DataBox label="Entry"         value={`$${fmt(t.entry)}`}        accent="text-cyan-300" />
        <DataBox label="Stop loss"     value={`$${fmt(t.stopLoss)}`}     accent="text-rose-300" />
        <DataBox label="Target"        value={`$${fmt(t.target)}`}       accent="text-emerald-300" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <DataBox label="Risk / Reward" value={`${t.riskReward.toFixed(1)}×`} accent="text-amber-300" />
        <DataBox label="ATR (daily)"   value={`${t.atrDaily}%`}              accent="text-amber-200" />
        <DataBox label="Max position"  value={`${t.maxPosition}%`} />
      </div>

      {/* risk vs reward visual */}
      <div className="rounded-lg border border-white/6 bg-slate-950/40 p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Risk vs reward
        </p>
        <div className="flex h-4 overflow-hidden rounded-full">
          <div
            className="h-full bg-rose-500/70 flex items-center justify-center"
            style={{ width: `${(1 / (1 + t.riskReward)) * 100}%` }}
          >
            <span className="text-[9px] font-bold text-white px-1">
              -{riskPct}%
            </span>
          </div>
          <div
            className="h-full bg-emerald-500/70 flex items-center justify-center"
            style={{ width: `${(t.riskReward / (1 + t.riskReward)) * 100}%` }}
          >
            <span className="text-[9px] font-bold text-white px-1">
              +{rewardPct}%
            </span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-600 leading-relaxed">
        Educational demo only. Entry / stop / target are illustrative — not live
        quotes. Always verify prices and manage risk independently.
      </p>
    </div>
  );
}

function ReasoningTab({ signal }: { signal: StockSignal }) {
  const r = buildReasoning(signal);
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/70 mb-1.5">
          Signal thesis
        </p>
        <p className="text-sm leading-relaxed text-slate-200">{r.thesis}</p>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Supporting factors
        </p>
        <ol className="space-y-2">
          {r.points.map((pt, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[9px] font-bold text-emerald-400">
                {i + 1}
              </span>
              <p className="text-xs leading-relaxed text-slate-400">{pt}</p>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Risk factors
          </p>
        </div>
        <ul className="space-y-2">
          {r.risks.map((risk, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/60" />
              <p className="text-xs leading-relaxed text-slate-500">{risk}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TimelineTab({ signal }: { signal: StockSignal }) {
  const hoursAgo = parseInt(signal.trigger.timeAgo) || 6;
  const events = [
    {
      time: signal.trigger.timeAgo,
      label: "Triggering event",
      detail: signal.trigger.headline,
      color: "bg-amber-400",
      textColor: "text-amber-300",
    },
    {
      time: `${Math.max(1, hoursAgo - 1)}h ago`,
      label: "Signal generated",
      detail: `Demo agreement ${signal.confidence}% — ${signal.direction}`,
      color: signal.direction === "BUY" ? "bg-emerald-400" : signal.direction === "SELL" ? "bg-rose-400" : "bg-slate-400",
      textColor: signal.direction === "BUY" ? "text-emerald-300" : signal.direction === "SELL" ? "text-rose-300" : "text-slate-300",
    },
    {
      time: "Now",
      label: "Current status",
      detail: `Active · Updated ${signal.updatedAt} · ${signal.timeframe} horizon`,
      color: "bg-cyan-400",
      textColor: "text-cyan-300",
    },
    {
      time: `+${signal.timeframe === "Intraday" ? "1d" : signal.timeframe === "Short-term" ? "2–4w" : signal.timeframe === "Medium-term" ? "1–3m" : "3–12m"}`,
      label: "Expected resolution",
      detail: `${signal.timeframe} signal — monitor for thesis confirmation or invalidation`,
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
              <span
                className={cn(
                  "absolute -left-[18px] top-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950",
                  ev.color
                )}
              />
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className={cn("text-[10px] font-mono font-semibold", ev.textColor)}>
                  {ev.time}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {ev.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{ev.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReliabilityTab({ signal }: { signal: StockSignal }) {
  const skew = Math.abs(signal.bullStrength - signal.bearStrength);
  const score = Math.min(100, Math.round(signal.confidence * 0.65 + skew * 0.35));
  const metrics = [
    { label: "Demo agreement",  value: signal.confidence,              color: "bg-emerald-500" },
    { label: "Bull/Bear skew",    value: skew,                           color: "bg-cyan-500" },
    { label: "Bullish signals",   value: signal.bullStrength,             color: "bg-emerald-500" },
    { label: "Bearish signals",   value: signal.bearStrength,             color: "bg-rose-500" },
  ];

  return (
    <div className="space-y-4">
      {/* overall score */}
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
          <p className="text-[11px] text-slate-400">
            Composite of demo agreement, skew, and narrative strength
          </p>
          <p className={cn(
            "mt-1 text-[10px] font-bold uppercase tracking-wider",
            score > 70 ? "text-emerald-400" : score > 50 ? "text-amber-400" : "text-rose-400"
          )}>
            {score > 70 ? "High reliability" : score > 50 ? "Moderate reliability" : "Low reliability"}
          </p>
        </div>
      </div>

      {/* metrics */}
      <div className="space-y-2.5">
        {metrics.map((m) => (
          <StrengthRow key={m.label} label={m.label} value={m.value} color={m.color} />
        ))}
      </div>

      {/* model notes */}
      <div className="rounded-lg border border-white/6 bg-slate-950/30 p-3 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Model notes
        </p>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Signals are generated deterministically from sector, sub-industry, and
          geography — not from live price data or ML inference. Use as a
          structured thinking framework. Reliability score reflects internal
          model consistency only.
        </p>
      </div>
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
  const [tab, setTab] = useState<Tab>("trade");
  const dc = DIRECTION_COLOR[signal.direction];
  const vc = VOLATILITY_COLOR[signal.volatility];

  const dirIcon =
    signal.direction === "BUY" ? (
      <TrendingUp className="h-4 w-4 text-emerald-400" />
    ) : signal.direction === "SELL" ? (
      <TrendingDown className="h-4 w-4 text-rose-400" />
    ) : null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      {/* accent bar */}
      <div
        className={cn(
          "h-1 w-full shrink-0",
          signal.direction === "BUY"
            ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
            : signal.direction === "SELL"
            ? "bg-gradient-to-r from-rose-500 to-orange-500"
            : "bg-slate-600"
        )}
      />

      {/* ── HEADER ── */}
      <div className="shrink-0 border-b border-white/8 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {dirIcon}
              <span className="font-mono text-2xl font-bold text-white">
                {signal.symbol}
              </span>
              <span className={cn("rounded border px-1.5 py-0.5 text-xs font-bold tracking-wider", dc)}>
                {signal.direction}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-300">{signal.name}</p>
            <p className="text-xs text-slate-500">
              {signal.sector} · {signal.assetClass}
            </p>
          </div>
          {/* confidence */}
          <div className="shrink-0 text-right">
            <p
              className={cn(
                "text-4xl font-bold tabular-nums leading-none",
                signal.direction === "BUY"
                  ? "text-emerald-300"
                  : signal.direction === "SELL"
                  ? "text-rose-300"
                  : "text-slate-300"
              )}
            >
              {signal.confidence}%
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">demo agreement score</p>
            <p className="mt-1 text-sm font-semibold text-amber-300 tabular-nums">
              {Math.abs(signal.bullStrength - signal.bearStrength)}%
            </p>
            <p className="text-[10px] text-slate-600">bull/bear skew</p>
            <button
              onClick={onClose}
              className="mt-2 rounded-lg p-1 text-slate-500 hover:bg-white/8 hover:text-white transition"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* bull / bear bars */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-emerald-400/80">Bullish Strength</span>
              <span className="tabular-nums text-slate-400">{signal.bullStrength}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-emerald-500"
                style={{ width: `${signal.bullStrength}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-rose-400/80">Bearish Strength</span>
              <span className="tabular-nums text-slate-400">{signal.bearStrength}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-rose-500"
                style={{ width: `${signal.bearStrength}%` }}
              />
            </div>
          </div>
        </div>

        {/* tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium", vc)}>
            {signal.volatility} VOLATILITY
          </span>
          <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
            {signal.timeframe}
          </span>
          {signal.tags.map((t) => (
            <span key={t} className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
              {t}
            </span>
          ))}
          <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
            {GEO_SENSITIVITY_LABEL[signal.geoSensitivity].split(" ")[0].toLowerCase()}
          </span>
        </div>

        {/* triggering event */}
        <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/80">
              Triggering Event
            </span>
            <span className="ml-auto text-[10px] text-slate-500">
              {signal.trigger.timeAgo}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-200 leading-snug">
            {signal.trigger.headline}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            {GEO_SENSITIVITY_LABEL[signal.trigger.category]} · Severity{" "}
            {signal.trigger.severity}/100
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
        {tab === "trade"       && <TradeTab       signal={signal} />}
        {tab === "reasoning"   && <ReasoningTab   signal={signal} />}
        {tab === "timeline"    && <TimelineTab    signal={signal} />}
        {tab === "reliability" && <ReliabilityTab signal={signal} />}
      </div>
    </div>
  );
}
