"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  createChart,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type Time,
} from "lightweight-charts";
import type { OhlcvBar, ChartResponse } from "@/app/api/chart/[symbol]/route";
import {
  ema as calcEma,
  rsiSeries,
  macdSeries,
  bollingerSeries,
  scoreTechnicals,
} from "@/lib/technical-analysis";
import type { CountryStock } from "@/data/country-markets";
import { RISK_COLORS } from "@/data/country-markets";
import { cn } from "@/lib/cn";
import {
  X,
  TrendingUp,
  TrendingDown,
  Plus,
  BarChart2,
  Activity,
  Loader2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Indicator {
  id: string;
  label: string;
  enabled: boolean;
  color: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatChange(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function toTime(ts: number): Time {
  return ts as Time;
}

// ─── Chart renderer (runs inside useEffect) ───────────────────────────────────

function buildCharts(
  container: HTMLDivElement,
  rsiContainer: HTMLDivElement,
  macdContainer: HTMLDivElement,
  bars: OhlcvBar[],
  indicators: Indicator[]
): () => void {
  const isEnabled = (id: string) =>
    indicators.find((i) => i.id === id)?.enabled ?? false;

  const closes = bars.map((b) => b.close);
  const highs   = bars.map((b) => b.high);
  const lows    = bars.map((b) => b.low);
  const volumes = bars.map((b) => b.volume);

  const commonOpts = {
    layout: {
      background: { color: "#0f172a" },
      textColor: "#94a3b8",
      fontSize: 11,
      fontFamily: "'GeistMono', monospace",
    },
    grid: {
      vertLines: { color: "#1e293b" },
      horzLines: { color: "#1e293b" },
    },
    crosshair: { mode: CrosshairMode.Normal },
    rightPriceScale: { borderColor: "#1e293b" },
    timeScale: { borderColor: "#1e293b", timeVisible: true },
  };

  // ── Main chart ──
  const chart = createChart(container, {
    ...commonOpts,
    height: container.offsetHeight || 340,
    width: container.offsetWidth,
  });

  const candleSeries = chart.addCandlestickSeries({
    upColor: "#22c55e",
    downColor: "#ef4444",
    borderUpColor: "#22c55e",
    borderDownColor: "#ef4444",
    wickUpColor: "#22c55e",
    wickDownColor: "#ef4444",
  });
  candleSeries.setData(
    bars.map((b) => ({
      time: toTime(b.time),
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    })) as CandlestickData[]
  );

  // Volume (as histogram in main chart, price scale hidden)
  if (isEnabled("volume")) {
    const volSeries = chart.addHistogramSeries({
      color: "#334155",
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volSeries.setData(
      bars.map((b) => ({
        time: toTime(b.time),
        value: b.volume,
        color: b.close >= b.open ? "#22c55e33" : "#ef444433",
      })) as HistogramData[]
    );
  }

  // EMA 20
  if (isEnabled("ema20") && closes.length >= 20) {
    const ema20 = calcEma(closes, 20);
    const offset = closes.length - ema20.length;
    const ema20Series = chart.addLineSeries({
      color: "#38bdf8",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
      title: "EMA20",
    });
    ema20Series.setData(
      ema20.map((v, i) => ({ time: toTime(bars[i + offset].time), value: v })) as LineData[]
    );
  }

  // EMA 50
  if (isEnabled("ema50") && closes.length >= 50) {
    const ema50 = calcEma(closes, 50);
    const offset = closes.length - ema50.length;
    const ema50Series = chart.addLineSeries({
      color: "#f59e0b",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
      title: "EMA50",
    });
    ema50Series.setData(
      ema50.map((v, i) => ({ time: toTime(bars[i + offset].time), value: v })) as LineData[]
    );
  }

  // Bollinger Bands
  if (isEnabled("bb") && closes.length >= 20) {
    const bb = bollingerSeries(closes, 20, 2);
    const offset = closes.length - bb.length;
    const bbUpper = chart.addLineSeries({
      color: "#a855f7",
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      title: "BB+2σ",
    });
    const bbMiddle = chart.addLineSeries({
      color: "#7c3aed",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      title: "BB mid",
    });
    const bbLower = chart.addLineSeries({
      color: "#a855f7",
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      title: "BB-2σ",
    });
    bbUpper.setData(bb.map((p, i) => ({ time: toTime(bars[i + offset].time), value: p.upper })) as LineData[]);
    bbMiddle.setData(bb.map((p, i) => ({ time: toTime(bars[i + offset].time), value: p.middle })) as LineData[]);
    bbLower.setData(bb.map((p, i) => ({ time: toTime(bars[i + offset].time), value: p.lower })) as LineData[]);
  }

  chart.timeScale().fitContent();

  // ── RSI sub-chart ──
  let rsiChart: IChartApi | null = null;
  if (isEnabled("rsi") && closes.length > 15) {
    rsiChart = createChart(rsiContainer, {
      ...commonOpts,
      height: rsiContainer.offsetHeight || 120,
      width: rsiContainer.offsetWidth,
      rightPriceScale: {
        borderColor: "#1e293b",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    });

    const rsiArr = rsiSeries(closes, 14);
    const rsiOffset = closes.length - rsiArr.length;
    const rsiLine = rsiChart.addLineSeries({
      color: "#a78bfa",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
      title: "RSI(14)",
    });
    rsiLine.setData(
      rsiArr.map((v, i) => ({ time: toTime(bars[i + rsiOffset].time), value: v })) as LineData[]
    );

    // Overbought / oversold levels
    const ob = rsiChart.addLineSeries({ color: "#ef444466", lineWidth: 1, lineStyle: 1, priceLineVisible: false, lastValueVisible: false });
    const os = rsiChart.addLineSeries({ color: "#22c55e66", lineWidth: 1, lineStyle: 1, priceLineVisible: false, lastValueVisible: false });
    const midRsi = rsiChart.addLineSeries({ color: "#33415566", lineWidth: 1, lineStyle: 1, priceLineVisible: false, lastValueVisible: false });
    ob.setData([{ time: toTime(bars[0].time), value: 70 }, { time: toTime(bars[bars.length - 1].time), value: 70 }] as LineData[]);
    os.setData([{ time: toTime(bars[0].time), value: 30 }, { time: toTime(bars[bars.length - 1].time), value: 30 }] as LineData[]);
    midRsi.setData([{ time: toTime(bars[0].time), value: 50 }, { time: toTime(bars[bars.length - 1].time), value: 50 }] as LineData[]);

    rsiChart.timeScale().fitContent();
  }

  // ── MACD sub-chart ──
  let macdChart: IChartApi | null = null;
  if (isEnabled("macd") && closes.length >= 35) {
    macdChart = createChart(macdContainer, {
      ...commonOpts,
      height: macdContainer.offsetHeight || 100,
      width: macdContainer.offsetWidth,
    });

    const { macd, signal, histogram, offset } = macdSeries(closes, 12, 26, 9);
    const startIdx = offset;

    const macdLine = macdChart.addLineSeries({ color: "#38bdf8", lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title: "MACD" });
    const sigLine  = macdChart.addLineSeries({ color: "#f59e0b", lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title: "Signal" });
    const histSeries = macdChart.addHistogramSeries({ priceLineVisible: false, lastValueVisible: false });

    const sigOffset = signal.length > 0 ? macd.length - signal.length : 0;
    macdLine.setData(macd.map((v, i) => ({ time: toTime(bars[i + (closes.length - macd.length)].time), value: v })) as LineData[]);
    sigLine.setData(signal.map((v, i) => ({ time: toTime(bars[i + sigOffset + (closes.length - macd.length)].time), value: v })) as LineData[]);
    histSeries.setData(
      histogram.map((v, i) => ({
        time: toTime(bars[i + startIdx].time),
        value: v,
        color: v >= 0 ? "#22c55e88" : "#ef444488",
      })) as HistogramData[]
    );

    macdChart.timeScale().fitContent();
  }

  // Sync time scales between charts
  const allCharts = [chart, rsiChart, macdChart].filter(Boolean) as IChartApi[];
  if (allCharts.length > 1) {
    for (const c of allCharts) {
      c.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (!range) return;
        for (const other of allCharts) {
          if (other !== c) other.timeScale().setVisibleLogicalRange(range);
        }
      });
    }
  }

  // Resize observer
  const ro = new ResizeObserver(() => {
    chart.applyOptions({ width: container.offsetWidth });
    rsiChart?.applyOptions({ width: rsiContainer.offsetWidth });
    macdChart?.applyOptions({ width: macdContainer.offsetWidth });
  });
  ro.observe(container);

  return () => {
    ro.disconnect();
    chart.remove();
    rsiChart?.remove();
    macdChart?.remove();
  };
}

// ─── Signal badge ─────────────────────────────────────────────────────────────

function SignalBadge({ bars }: { bars: OhlcvBar[] }) {
  const signal = useMemo(() => {
    if (bars.length < 30) return null;
    return scoreTechnicals(
      bars.map((b) => b.close),
      bars.map((b) => b.high),
      bars.map((b) => b.low),
      bars.map((b) => b.volume)
    );
  }, [bars]);

  if (!signal) return null;

  const dirColor =
    signal.direction === "BUY"
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : signal.direction === "SELL"
      ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
      : "text-slate-400 border-slate-600 bg-slate-800/40";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-slate-900/60 p-3.5">
      <div className={cn("shrink-0 rounded-lg border px-3 py-1.5 text-sm font-black tracking-wider", dirColor)}>
        {signal.direction}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">
            Confidence <span className="font-semibold text-slate-200">{signal.confidence}%</span>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">
            RSI <span className="font-semibold text-slate-200">{signal.rsiValue}</span>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">
            EMA20 <span className="font-mono text-[11px] text-slate-200">${signal.ema20}</span>
          </span>
        </div>
        <div className="mt-1.5 flex gap-2">
          <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-1 rounded-full bg-emerald-500 transition-all" style={{ width: `${signal.bullStrength}%` }} />
          </div>
          <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-1 rounded-full bg-rose-500 transition-all" style={{ width: `${signal.bearStrength}%` }} />
          </div>
        </div>
        <div className="mt-1 flex gap-2 text-[10px]">
          <span className="text-emerald-500/70">Bull {signal.bullStrength}%</span>
          <span className="text-rose-500/70 ml-auto">Bear {signal.bearStrength}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Indicator votes panel ────────────────────────────────────────────────────

function VotesPanel({ bars }: { bars: OhlcvBar[] }) {
  const [open, setOpen] = useState(false);
  const signal = useMemo(() => {
    if (bars.length < 30) return null;
    return scoreTechnicals(
      bars.map((b) => b.close),
      bars.map((b) => b.high),
      bars.map((b) => b.low),
      bars.map((b) => b.volume)
    );
  }, [bars]);

  if (!signal) return null;

  return (
    <div className="rounded-xl border border-white/8 bg-slate-900/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500"
      >
        Indicator votes
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-white/6 px-3.5 pb-3 pt-2 space-y-1.5">
          {signal.indicatorVotes.map((v) => {
            const color =
              v.vote === "BUY" ? "text-emerald-400" : v.vote === "SELL" ? "text-rose-400" : "text-slate-500";
            return (
              <div key={v.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{v.label}</span>
                <span className={cn("font-bold", color)}>{v.vote}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

const DEFAULT_INDICATORS: Indicator[] = [
  { id: "ema20",  label: "EMA 20",    enabled: true,  color: "#38bdf8" },
  { id: "ema50",  label: "EMA 50",    enabled: true,  color: "#f59e0b" },
  { id: "volume", label: "Volume",    enabled: true,  color: "#334155" },
  { id: "bb",     label: "Bollinger", enabled: false, color: "#a855f7" },
  { id: "rsi",    label: "RSI",       enabled: true,  color: "#a78bfa" },
  { id: "macd",   label: "MACD",      enabled: false, color: "#38bdf8" },
];

export function StockChartModal({
  stock,
  countryRiskLevel,
  livePrice,
  liveChange,
  onClose,
  onAddToPortfolio,
}: {
  stock: CountryStock;
  countryRiskLevel: string;
  livePrice?: number;
  liveChange?: number;
  onClose: () => void;
  onAddToPortfolio: () => void;
}) {
  const [indicators, setIndicators] = useState<Indicator[]>(DEFAULT_INDICATORS);
  const [chartData, setChartData] = useState<ChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mainRef  = useRef<HTMLDivElement | null>(null);
  const rsiRef   = useRef<HTMLDivElement | null>(null);
  const macdRef  = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const displayPrice = livePrice ?? stock.price;
  const displayChange = liveChange ?? stock.change;
  const positive = displayChange >= 0;

  // Fetch OHLCV data
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/chart/${encodeURIComponent(stock.symbol)}`)
      .then((r) => r.json() as Promise<ChartResponse>)
      .then((d) => {
        if (!d.bars?.length) throw new Error(d.error ?? "No data");
        setChartData(d);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [stock.symbol]);

  // Render / re-render charts whenever data or indicators change
  useEffect(() => {
    if (!chartData?.bars?.length || !mainRef.current || !rsiRef.current || !macdRef.current) return;
    cleanupRef.current?.();
    cleanupRef.current = buildCharts(
      mainRef.current,
      rsiRef.current,
      macdRef.current,
      chartData.bars,
      indicators
    );
    return () => { cleanupRef.current?.(); };
  }, [chartData, indicators]);

  const toggleIndicator = useCallback((id: string) => {
    setIndicators((prev) =>
      prev.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i))
    );
  }, []);

  const showRsi  = indicators.find((i) => i.id === "rsi")?.enabled;
  const showMacd = indicators.find((i) => i.id === "macd")?.enabled;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative flex h-full w-full max-w-3xl flex-col border-l border-white/10 bg-slate-950 shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-white">{stock.symbol}</span>
                <span className="rounded border border-white/10 px-1.5 py-px text-[9px] text-slate-500">{stock.exchange}</span>
                {livePrice && (
                  <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-px text-[9px] font-semibold text-emerald-400">LIVE</span>
                )}
              </div>
              <p className="truncate text-xs text-slate-400">{stock.name} · {stock.sector}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="font-mono text-lg font-bold text-white">${displayPrice.toFixed(2)}</p>
              <p className={cn("font-mono text-xs font-medium flex items-center justify-end gap-0.5",
                positive ? "text-emerald-400" : "text-rose-400")}>
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatChange(displayChange)}
              </p>
            </div>
            <button type="button" onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/8 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Indicator toolbar ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-white/6 px-4 py-2 scrollbar-none">
          <span className="shrink-0 text-[10px] text-slate-600 mr-1">Indicators:</span>
          {indicators.map((ind) => (
            <button
              key={ind.id}
              type="button"
              onClick={() => toggleIndicator(ind.id)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition",
                ind.enabled
                  ? "border-transparent text-slate-950"
                  : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
              )}
              style={ind.enabled ? { background: ind.color } : {}}
            >
              {ind.label}
            </button>
          ))}
        </div>

        {/* ── Chart area ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-0">
          {loading && (
            <div className="flex flex-1 items-center justify-center gap-3 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading chart data…</span>
            </div>
          )}
          {error && !loading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-500">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <p className="text-sm">{error}</p>
              <p className="text-xs text-slate-600">Stooq may not have data for this symbol</p>
            </div>
          )}
          {!loading && !error && (
            <div className="flex flex-1 flex-col min-h-0">
              {/* Main candle chart */}
              <div
                ref={mainRef}
                className="flex-1 min-h-0"
                style={{ minHeight: showRsi || showMacd ? "200px" : "100%" }}
              />
              {/* RSI pane */}
              {showRsi && (
                <div className="border-t border-white/6">
                  <div className="px-3 pt-1 text-[10px] font-semibold text-slate-600">RSI (14)</div>
                  <div ref={rsiRef} style={{ height: "110px" }} />
                </div>
              )}
              {/* MACD pane */}
              {showMacd && (
                <div className="border-t border-white/6">
                  <div className="px-3 pt-1 text-[10px] font-semibold text-slate-600">MACD (12,26,9)</div>
                  <div ref={macdRef} style={{ height: "100px" }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Signal + Add to Portfolio ── */}
        {!loading && !error && chartData?.bars && (
          <div className="border-t border-white/8 p-4 space-y-3">
            <SignalBadge bars={chartData.bars} />
            <VotesPanel bars={chartData.bars} />
            <button
              type="button"
              onClick={onAddToPortfolio}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 py-3 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-cyan-500"
            >
              <Plus className="h-4 w-4" />
              Add {stock.symbol} to Portfolio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
