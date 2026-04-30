"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChartIndicator } from "./trading-view-chart";
import { TradingViewChart } from "./trading-view-chart";
import { cn } from "@/lib/cn";
import { formatInstrumentPrice, instrumentCurrency } from "@/lib/instrument-currency";
import { BarChart3, Clock3, DatabaseZap, Search, SlidersHorizontal } from "lucide-react";

const RANGE_OPTIONS = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "2Y", days: 730 },
];

const INDICATORS: { id: ChartIndicator; label: string; group: string }[] = [
  { id: "volume", label: "Volume", group: "Volume" },
  { id: "obv", label: "OBV", group: "Volume" },
  { id: "ema20", label: "EMA 20", group: "Moving averages" },
  { id: "ema50", label: "EMA 50", group: "Moving averages" },
  { id: "sma20", label: "SMA 20", group: "Moving averages" },
  { id: "sma50", label: "SMA 50", group: "Moving averages" },
  { id: "vwap", label: "VWAP", group: "Overlays" },
  { id: "atr", label: "ATR bands (±2×)", group: "Overlays" },
  { id: "bollinger", label: "Bollinger Bands", group: "Bands" },
  { id: "macd", label: "MACD (12,26,9)", group: "Momentum" },
  { id: "rsi", label: "RSI 14", group: "Oscillators" },
  { id: "stoch", label: "Stochastic (14,3)", group: "Oscillators" },
  { id: "williamsR", label: "Williams %R 14", group: "Oscillators" },
  { id: "adx", label: "ADX 14", group: "Oscillators" },
  { id: "roc", label: "ROC 14", group: "Oscillators" },
];

const ROADMAP_INDICATORS = ["Ichimoku", "Supertrend", "Pivot points", "Fibonacci tools"];

interface Props {
  symbol: string;
}

interface LiveQuote {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  fetchedAt: string;
  source: "live" | "unavailable";
  currency: string;
  error?: string;
}

export function ChartWorkspace({ symbol }: Props) {
  const router = useRouter();
  const [input, setInput] = useState(symbol);
  /** Avoid hydrating `<input>` on the server — extensions often inject attrs (e.g. data-sharkid) and break hydration. */
  const [symbolFieldReady, setSymbolFieldReady] = useState(false);
  const [rangeDays, setRangeDays] = useState(365);
  const [indicators, setIndicators] = useState<ChartIndicator[]>([
    "volume",
    "ema20",
    "ema50",
    "rsi",
  ]);
  const [quote, setQuote] = useState<LiveQuote | null>(null);

  useEffect(() => {
    setSymbolFieldReady(true);
  }, []);

  useEffect(() => {
    setInput(symbol);
  }, [symbol]);

  useEffect(() => {
    let active = true;
    const fetchQuote = () => {
      fetch(`/api/quotes?symbols=${encodeURIComponent(symbol)}`)
        .then((r) => r.json())
        .then((data: Record<string, LiveQuote>) => {
          if (!active) return;
          setQuote(data[symbol] ?? null);
        })
        .catch(() => {
          if (active) setQuote(null);
        });
    };
    fetchQuote();
    const id = window.setInterval(fetchQuote, 15_000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [symbol]);

  const grouped = useMemo(() => {
    return INDICATORS.reduce<Record<string, typeof INDICATORS>>((acc, item) => {
      acc[item.group] ??= [];
      acc[item.group].push(item);
      return acc;
    }, {});
  }, []);

  function toggle(id: ChartIndicator) {
    setIndicators((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function goToSymbol() {
    const next = input.trim().toUpperCase();
    if (!next) return;
    router.push(`/charts/${encodeURIComponent(next)}`);
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-slate-950">
      <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-slate-950 p-4 lg:block">
        <div className="mb-5">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Search className="h-3.5 w-3.5" />
            Symbol
          </p>
          <div className="flex gap-2">
            {symbolFieldReady ? (
              <>
                <input
                  id="chart-workspace-symbol"
                  name="chart-symbol"
                  autoComplete="off"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === "Enter") goToSymbol(); }}
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-500/50"
                />
                <button
                  type="button"
                  onClick={goToSymbol}
                  className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                >
                  Go
                </button>
              </>
            ) : (
              <>
                <div
                  className="min-w-0 flex-1 h-10 rounded-lg border border-white/10 bg-slate-900/80 motion-safe:animate-pulse"
                  aria-hidden
                />
                <div
                  className="h-10 w-[3.25rem] shrink-0 rounded-lg bg-cyan-500/15 motion-safe:animate-pulse"
                  aria-hidden
                />
              </>
            )}
          </div>
        </div>

        <div className="mb-5">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Clock3 className="h-3.5 w-3.5" />
            Range
          </p>
          <div className="grid grid-cols-5 gap-1">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRangeDays(r.days)}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs font-semibold transition",
                  rangeDays === r.days
                    ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-200"
                    : "border-white/10 text-slate-500 hover:text-white"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Indicators
          </p>
          <div className="space-y-4">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  {group}
                </p>
                <div className="space-y-1">
                  {items.map((item) => {
                    const active = indicators.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggle(item.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition",
                          active
                            ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                            : "border-white/8 bg-slate-900/50 text-slate-400 hover:text-white"
                        )}
                      >
                        {item.label}
                        <span className={cn("h-2 w-2 rounded-full", active ? "bg-amber-300" : "bg-slate-700")} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/8 bg-slate-900/40 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Indicator roadmap
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ROADMAP_INDICATORS.map((name) => (
                <span key={name} className="rounded border border-white/8 px-2 py-1 text-[10px] text-slate-500">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto overscroll-y-contain bg-black p-3 lg:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-500 shadow-sm">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          <span className="font-semibold text-slate-200">Wide chart workspace</span>
          <span className="hidden sm:inline">Candles · volume · overlays · oscillator panes</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {quote?.source === "live" ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live · {formatInstrumentPrice(quote.price, quote.currency)} · {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)}%
              </span>
            ) : (
              <span
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-700"
                title={quote?.error ?? "No last price from Finnhub/Stooq/Yahoo for this symbol"}
              >
                <DatabaseZap className="h-3 w-3 shrink-0" />
                <span className="truncate">Live quote unavailable</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 font-medium text-slate-400">
              OHLCV & agreement strip refresh on a timer (see env); quotes poll ~15s when live
            </span>
          </div>
        </div>

        <TradingViewChart
          symbol={symbol}
          exchange="Chart workspace"
          rangeDays={rangeDays}
          indicators={indicators}
          priceHeightClassName="h-[560px]"
          className="min-h-[760px]"
          loadSignalInsight
          currency={quote?.source === "live" ? quote.currency : instrumentCurrency(symbol)}
          anchorPrice={quote?.source === "live" && quote.price > 0 ? quote.price : undefined}
        />
      </main>
    </div>
  );
}
