"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type LineData,
  type Time,
} from "lightweight-charts";
import type { ChartResponse, OhlcvBar } from "@/app/api/chart/[symbol]/route";
import type { RealSignal } from "@/app/api/signal/[symbol]/route";
import {
  adxSeries,
  atrSeries,
  bollingerSeries,
  ema,
  obvSeries,
  rocSeries,
  rsiSeries,
  sma,
  stochasticFull,
  vwapSeries,
  williamsRSeries,
} from "@/lib/technical-analysis";
import { formatInstrumentPrice, instrumentCurrency } from "@/lib/instrument-currency";
import { cn } from "@/lib/cn";
import { AlertTriangle, Loader2, Scale } from "lucide-react";

export type ChartSignalAction = "BUY" | "SELL" | "HOLD";

export interface ChartSignalInsight {
  direction: ChartSignalAction;
  confidence: number;
  dataSource?: string;
  bullStrength?: number;
  bearStrength?: number;
  summaryLines?: string[];
  indicatorVotes?: { label: string; vote: string; weight: number }[];
}

export function insightFromRealSignal(real: RealSignal): ChartSignalInsight {
  return {
    direction: real.direction,
    confidence: real.confidence,
    dataSource: real.dataSource,
    bullStrength: real.bullStrength,
    bearStrength: real.bearStrength,
    indicatorVotes: real.indicatorVotes,
  };
}

function formatInsightLines(insight: ChartSignalInsight): string[] {
  if (insight.summaryLines?.length) return insight.summaryLines;
  if (!insight.indicatorVotes?.length) return [];
  return [...insight.indicatorVotes]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4)
    .map((v) => `${v.label}: ${v.vote}`);
}

function SignalInsightStrip({
  insight,
  loading,
  error,
  theme,
}: {
  insight: ChartSignalInsight | null;
  loading: boolean;
  error: boolean;
  theme: "dark" | "light";
}) {
  const dark = theme === "dark";
  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 border-b px-4 py-3 text-xs",
          dark ? "border-white/10 bg-slate-900/80 text-slate-500" : "border-slate-200 bg-slate-50 text-slate-500"
        )}
      >
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        Computing buy / sell / hold from technicals…
      </div>
    );
  }
  if (error && !insight) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 border-b px-4 py-2.5 text-[11px]",
          dark ? "border-white/10 bg-slate-900/60 text-slate-500" : "border-slate-200 bg-slate-50 text-slate-500"
        )}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        Signal insight unavailable for this symbol right now.
      </div>
    );
  }
  if (!insight) return null;

  const dir = insight.direction;
  const palette =
    dir === "BUY"
      ? {
          border: dark ? "border-emerald-500/35" : "border-emerald-200",
          bg: dark ? "bg-emerald-950/35" : "bg-emerald-50",
          badge: dark ? "bg-emerald-500/25 text-emerald-200" : "bg-emerald-100 text-emerald-800",
          accent: dark ? "text-emerald-300" : "text-emerald-700",
        }
      : dir === "SELL"
        ? {
            border: dark ? "border-rose-500/35" : "border-rose-200",
            bg: dark ? "bg-rose-950/35" : "bg-rose-50",
            badge: dark ? "bg-rose-500/25 text-rose-200" : "bg-rose-100 text-rose-800",
            accent: dark ? "text-rose-300" : "text-rose-700",
          }
        : {
            border: dark ? "border-amber-500/30" : "border-amber-200",
            bg: dark ? "bg-amber-950/25" : "bg-amber-50/90",
            badge: dark ? "bg-amber-500/20 text-amber-200" : "bg-amber-100 text-amber-900",
            accent: dark ? "text-amber-200" : "text-amber-800",
          };

  const lines = formatInsightLines(insight);
  const conf = Math.round(insight.confidence);

  return (
    <div className={cn("border-b px-4 py-3", palette.border, palette.bg)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Scale className={cn("h-4 w-4 shrink-0 opacity-70", palette.accent)} aria-hidden />
          <span
            className={cn(
              "rounded-md px-2 py-0.5 font-mono text-xs font-black tracking-wide",
              palette.badge
            )}
          >
            {dir}
          </span>
          <span className={cn("text-sm font-semibold", dark ? "text-white" : "text-slate-900")}>
            Signal insight
          </span>
          <span className={cn("text-xs", dark ? "text-slate-400" : "text-slate-600")}>
            Confidence {conf}% (from weighted indicator agreement)
          </span>
        </div>
        {insight.dataSource && (
          <span className={cn("max-w-full truncate text-[10px]", dark ? "text-slate-500" : "text-slate-500")}>
            {insight.dataSource}
          </span>
        )}
      </div>
      {lines.length > 0 && (
        <p className={cn("mt-2 text-[11px] leading-relaxed", dark ? "text-slate-400" : "text-slate-600")}>
          <span className="font-semibold text-slate-500">Drivers: </span>
          {lines.join(" · ")}
        </p>
      )}
      {insight.bullStrength != null && insight.bearStrength != null && (
        <div className="mt-2 max-w-md">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-black/20 dark:bg-white/10">
            {(() => {
              const t = insight.bullStrength! + insight.bearStrength! || 1;
              const bullW = (insight.bullStrength! / t) * 100;
              const bearW = (insight.bearStrength! / t) * 100;
              return (
                <>
                  <div className="h-full bg-emerald-500/80" style={{ width: `${bullW}%` }} />
                  <div className="h-full bg-rose-500/80" style={{ width: `${bearW}%` }} />
                </>
              );
            })()}
          </div>
          <p className={cn("mt-1 text-[10px]", dark ? "text-slate-500" : "text-slate-500")}>
            Relative bull vs bear strength from the model
          </p>
        </div>
      )}
      <p className={cn("mt-2 text-[10px] leading-snug", dark ? "text-slate-600" : "text-slate-400")}>
        Educational model only — not investment advice.
      </p>
    </div>
  );
}

export type ChartIndicator =
  | "volume"
  | "ema20"
  | "ema50"
  | "sma20"
  | "sma50"
  | "bollinger"
  | "vwap"
  | "atr"
  | "rsi"
  | "macd"
  | "stoch"
  | "williamsR"
  | "adx"
  | "roc"
  | "obv";

function toTime(ts: number): Time {
  return ts as Time;
}

function pctChange(bars: OhlcvBar[]) {
  if (bars.length < 2) return 0;
  const last = bars[bars.length - 1].close;
  const prev = bars[bars.length - 2].close;
  return ((last - prev) / prev) * 100;
}

const OSCILLATOR_IDS: ChartIndicator[] = ["rsi", "stoch", "williamsR", "adx", "roc"];

function buildChart(
  priceEl: HTMLDivElement,
  lowers: { macd: HTMLDivElement | null; osc: HTMLDivElement | null; obv: HTMLDivElement | null },
  bars: OhlcvBar[],
  indicators: ChartIndicator[],
  theme: "dark" | "light",
  currency: string
): () => void {
  const closes = bars.map((b) => b.close);
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const vols = bars.map((b) => b.volume);
  const enabled = (id: ChartIndicator) => indicators.includes(id);
  const dark = theme === "dark";
  const border = dark ? "#1e293b" : "#e2e8f0";
  const common = {
    layout: {
      background: { color: dark ? "#020617" : "#ffffff" },
      textColor: dark ? "#94a3b8" : "#475569",
      fontSize: 11,
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    },
    grid: {
      vertLines: { color: dark ? "#111827" : "#eef2f7" },
      horzLines: { color: dark ? "#111827" : "#eef2f7" },
    },
    crosshair: { mode: CrosshairMode.Normal },
    rightPriceScale: {
      borderColor: border,
      scaleMargins: { top: 0.08, bottom: 0.24 },
    },
    timeScale: {
      borderColor: border,
      timeVisible: true,
      secondsVisible: false,
    },
  };

  const chart = createChart(priceEl, {
    ...common,
    localization: {
      priceFormatter: (p: number) => formatInstrumentPrice(p, currency),
    },
    width: priceEl.offsetWidth,
    height: priceEl.offsetHeight || 390,
  });

  const candles = chart.addSeries(CandlestickSeries, {
    upColor: "#26a69a",
    downColor: "#ef5350",
    borderVisible: false,
    wickUpColor: "#26a69a",
    wickDownColor: "#ef5350",
  });
  candles.setData(bars.map((b) => ({
    time: toTime(b.time),
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
  })) as CandlestickData[]);

  if (enabled("volume")) {
    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.72, bottom: 0 },
    });
    volume.setData(bars.map((b) => ({
      time: toTime(b.time),
      value: b.volume,
      color: b.close >= b.open ? "#26a69a66" : "#ef535066",
    })) as HistogramData[]);
  }

  const ema20 = ema(closes, 20);
  if (enabled("ema20") && ema20.length) {
    const offset = closes.length - ema20.length;
    const line = chart.addSeries(LineSeries, {
      color: "#2196f3",
      lineWidth: 1,
      priceLineVisible: false,
      title: "EMA 20",
    });
    line.setData(ema20.map((v, i) => ({ time: toTime(bars[i + offset].time), value: v })) as LineData[]);
  }

  const ema50 = ema(closes, 50);
  if (enabled("ema50") && ema50.length) {
    const offset = closes.length - ema50.length;
    const line = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 1,
      priceLineVisible: false,
      title: "EMA 50",
    });
    line.setData(ema50.map((v, i) => ({ time: toTime(bars[i + offset].time), value: v })) as LineData[]);
  }

  const addSma = (period: 20 | 50, color: string) => {
    const values = sma(closes, period);
    if (!values.length) return;
    const offset = closes.length - values.length;
    const line = chart.addSeries(LineSeries, {
      color,
      lineWidth: 1,
      priceLineVisible: false,
      title: `SMA ${period}`,
    });
    line.setData(values.map((v, i) => ({ time: toTime(bars[i + offset].time), value: v })) as LineData[]);
  };
  if (enabled("sma20")) addSma(20, "#0ea5e9");
  if (enabled("sma50")) addSma(50, "#64748b");

  if (enabled("bollinger")) {
    const bb = bollingerSeries(closes, 20, 2);
    if (bb.length) {
      const offset = closes.length - bb.length;
      const upper = chart.addSeries(LineSeries, { color: "#a855f7", lineWidth: 1, lineStyle: 2, priceLineVisible: false, title: "BB Upper" });
      const middle = chart.addSeries(LineSeries, { color: "#8b5cf6", lineWidth: 1, priceLineVisible: false, title: "BB Mid" });
      const lower = chart.addSeries(LineSeries, { color: "#a855f7", lineWidth: 1, lineStyle: 2, priceLineVisible: false, title: "BB Lower" });
      upper.setData(bb.map((p, i) => ({ time: toTime(bars[i + offset].time), value: p.upper })) as LineData[]);
      middle.setData(bb.map((p, i) => ({ time: toTime(bars[i + offset].time), value: p.middle })) as LineData[]);
      lower.setData(bb.map((p, i) => ({ time: toTime(bars[i + offset].time), value: p.lower })) as LineData[]);
    }
  }

  if (enabled("vwap")) {
    const vw = vwapSeries(bars);
    const line = chart.addSeries(LineSeries, {
      color: "#06b6d4",
      lineWidth: 1,
      priceLineVisible: false,
      title: "VWAP",
    });
    line.setData(vw.map((v, i) => ({ time: toTime(bars[i].time), value: v })) as LineData[]);
  }

  if (enabled("atr")) {
    const atr = atrSeries(highs, lows, closes, 14);
    const upper = chart.addSeries(LineSeries, {
      color: "#94a3b8",
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      title: "ATR+",
    });
    const lower = chart.addSeries(LineSeries, {
      color: "#94a3b8",
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      title: "ATR−",
    });
    const upData: LineData[] = [];
    const loData: LineData[] = [];
    for (let i = 0; i < bars.length; i++) {
      const a = atr[i];
      if (!Number.isFinite(a)) continue;
      const c = closes[i];
      upData.push({ time: toTime(bars[i].time), value: c + 2 * a });
      loData.push({ time: toTime(bars[i].time), value: c - 2 * a });
    }
    upper.setData(upData);
    lower.setData(loData);
  }

  let macdChart: IChartApi | null = null;
  if (enabled("macd") && lowers.macd) {
    const slow = ema(closes, 26);
    const fast = ema(closes, 12);
    const slowOff = closes.length - slow.length;
    const macdVals: number[] = [];
    for (let i = 0; i < slow.length; i++) {
      macdVals.push(fast[i + 14] - slow[i]);
    }
    const signalVals = ema(macdVals, 9);
    macdChart = createChart(lowers.macd, {
      ...common,
      width: lowers.macd.offsetWidth,
      height: lowers.macd.offsetHeight || 120,
      rightPriceScale: { borderColor: border, scaleMargins: { top: 0.1, bottom: 0.1 } },
    });
    const hist = macdChart.addSeries(HistogramSeries, {
      priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
      priceLineVisible: false,
    });
    const macdLine = macdChart.addSeries(LineSeries, {
      color: "#2962ff",
      lineWidth: 1,
      priceLineVisible: false,
      title: "MACD",
    });
    const signalLine = macdChart.addSeries(LineSeries, {
      color: "#ff6d00",
      lineWidth: 1,
      priceLineVisible: false,
      title: "Signal",
    });
    const histData: HistogramData[] = [];
    const macdData: LineData[] = [];
    const sigData: LineData[] = [];
    for (let i = 0; i < signalVals.length; i++) {
      const mk = i + 8;
      if (mk >= macdVals.length) break;
      const m = macdVals[mk];
      const s = signalVals[i];
      const h = m - s;
      const barIdx = slowOff + mk;
      if (barIdx >= bars.length) break;
      const t = toTime(bars[barIdx].time);
      histData.push({ time: t, value: h, color: h >= 0 ? "#26a69a99" : "#ef535099" });
      macdData.push({ time: t, value: m });
      sigData.push({ time: t, value: s });
    }
    hist.setData(histData);
    macdLine.setData(macdData);
    signalLine.setData(sigData);
  }

  let oscChart: IChartApi | null = null;
  const showOsc = OSCILLATOR_IDS.some((id) => enabled(id));
  if (showOsc && lowers.osc) {
    const needLeft = enabled("roc");
    oscChart = createChart(lowers.osc, {
      ...common,
      width: lowers.osc.offsetWidth,
      height: lowers.osc.offsetHeight || 150,
      rightPriceScale: { borderColor: border, scaleMargins: { top: 0.08, bottom: 0.08 } },
      leftPriceScale: needLeft
        ? { visible: true, borderColor: border, scaleMargins: { top: 0.12, bottom: 0.12 } }
        : { visible: false },
    });

    const hLine = (value: number, color: string) => {
      const line = oscChart!.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      line.setData([
        { time: toTime(bars[0].time), value },
        { time: toTime(bars[bars.length - 1].time), value },
      ] as LineData[]);
    };

    if (enabled("rsi")) {
      const rsi = rsiSeries(closes, 14);
      const rsiOff = closes.length - rsi.length;
      const rsiLine = oscChart.addSeries(LineSeries, {
        color: "#7e57c2",
        lineWidth: 1,
        priceLineVisible: false,
        title: "RSI 14",
      });
      rsiLine.setData(rsi.map((v, i) => ({ time: toTime(bars[i + rsiOff].time), value: v })) as LineData[]);
      const rsiMa = ema(rsi, 14);
      if (rsiMa.length) {
        const off2 = rsi.length - rsiMa.length;
        const line = oscChart.addSeries(LineSeries, {
          color: "#f6c453",
          lineWidth: 1,
          priceLineVisible: false,
          title: "RSI MA",
        });
        line.setData(rsiMa.map((v, i) => ({ time: toTime(bars[i + rsiOff + off2].time), value: v })) as LineData[]);
      }
      hLine(70, "#94a3b866");
      hLine(30, "#94a3b866");
    }

    if (enabled("stoch")) {
      const { k, d } = stochasticFull(highs, lows, closes, 14, 3);
      const kLine = oscChart.addSeries(LineSeries, {
        color: "#42a5f5",
        lineWidth: 1,
        priceLineVisible: false,
        title: "Stoch %K",
      });
      const dLine = oscChart.addSeries(LineSeries, {
        color: "#ec407a",
        lineWidth: 1,
        priceLineVisible: false,
        title: "Stoch %D",
      });
      kLine.setData(
        k
          .map((v, i) => (Number.isFinite(v) ? { time: toTime(bars[i].time), value: v } : null))
          .filter(Boolean) as LineData[]
      );
      dLine.setData(
        d
          .map((v, i) => (Number.isFinite(v) ? { time: toTime(bars[i].time), value: v } : null))
          .filter(Boolean) as LineData[]
      );
      hLine(80, "#64748b55");
      hLine(20, "#64748b55");
    }

    if (enabled("williamsR")) {
      const w = williamsRSeries(highs, lows, closes, 14);
      const line = oscChart.addSeries(LineSeries, {
        color: "#66bb6a",
        lineWidth: 1,
        priceLineVisible: false,
        title: "W%R (inv.)",
      });
      line.setData(
        w
          .map((v, i) => (Number.isFinite(v) ? { time: toTime(bars[i].time), value: 100 + v } : null))
          .filter(Boolean) as LineData[]
      );
    }

    if (enabled("adx")) {
      const adx = adxSeries(highs, lows, closes, 14);
      const line = oscChart.addSeries(LineSeries, {
        color: "#ab47bc",
        lineWidth: 1,
        priceLineVisible: false,
        title: "ADX 14",
      });
      line.setData(adx.map((v, i) => ({ time: toTime(bars[i].time), value: v })) as LineData[]);
      hLine(25, "#64748b44");
    }

    if (enabled("roc")) {
      const roc = rocSeries(closes, 14);
      const line = oscChart.addSeries(LineSeries, {
        color: "#26c6da",
        lineWidth: 1,
        priceLineVisible: false,
        title: "ROC %",
        priceScaleId: "left",
      });
      line.setData(
        roc
          .map((v, i) => (Number.isFinite(v) ? { time: toTime(bars[i].time), value: v } : null))
          .filter(Boolean) as LineData[]
      );
    }
  }

  let obvChart: IChartApi | null = null;
  if (enabled("obv") && lowers.obv) {
    const obv = obvSeries(closes, vols);
    obvChart = createChart(lowers.obv, {
      ...common,
      width: lowers.obv.offsetWidth,
      height: lowers.obv.offsetHeight || 100,
      rightPriceScale: { borderColor: border, scaleMargins: { top: 0.1, bottom: 0.1 } },
    });
    const line = obvChart.addSeries(LineSeries, {
      color: "#78909c",
      lineWidth: 1,
      priceLineVisible: false,
      title: "OBV",
    });
    line.setData(obv.map((v, i) => ({ time: toTime(bars[i].time), value: v })) as LineData[]);
  }

  const charts: IChartApi[] = [chart, macdChart, oscChart, obvChart].filter(Boolean) as IChartApi[];
  for (const c of charts) {
    c.timeScale().fitContent();
    c.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (!range) return;
      for (const other of charts) {
        if (other !== c) other.timeScale().setVisibleLogicalRange(range);
      }
    });
  }

  const ro = new ResizeObserver(() => {
    chart.applyOptions({ width: priceEl.offsetWidth });
    macdChart?.applyOptions({ width: lowers.macd?.offsetWidth ?? 0 });
    oscChart?.applyOptions({ width: lowers.osc?.offsetWidth ?? 0 });
    obvChart?.applyOptions({ width: lowers.obv?.offsetWidth ?? 0 });
  });
  ro.observe(priceEl);
  if (lowers.macd) ro.observe(lowers.macd);
  if (lowers.osc) ro.observe(lowers.osc);
  if (lowers.obv) ro.observe(lowers.obv);

  return () => {
    ro.disconnect();
    chart.remove();
    macdChart?.remove();
    oscChart?.remove();
    obvChart?.remove();
  };
}

interface Props {
  symbol: string;
  name?: string;
  exchange?: string;
  className?: string;
  indicators?: ChartIndicator[];
  rangeDays?: number;
  priceHeightClassName?: string;
  theme?: "dark" | "light";
  anchorPrice?: number;
  showIndicatorControls?: boolean;
  /** When set, controls the insight strip (`null` hides it). Omit both this and `loadSignalInsight` to hide. */
  signalInsight?: ChartSignalInsight | null;
  /** Fetch `/api/signal/[symbol]` and show buy/sell/hold strip (ignored if `signalInsight` is defined). */
  loadSignalInsight?: boolean;
  /** ISO-like code for price labels (USD, CAD, JPY, …). Defaults from symbol rules. */
  currency?: string;
}

const DEFAULT_INDICATORS: ChartIndicator[] = ["volume", "ema20", "ema50", "rsi"];
const INDICATOR_OPTIONS: { id: ChartIndicator; label: string }[] = [
  { id: "volume", label: "Volume" },
  { id: "obv", label: "OBV" },
  { id: "ema20", label: "EMA20" },
  { id: "ema50", label: "EMA50" },
  { id: "sma20", label: "SMA20" },
  { id: "sma50", label: "SMA50" },
  { id: "vwap", label: "VWAP" },
  { id: "atr", label: "ATR bands" },
  { id: "bollinger", label: "Bollinger" },
  { id: "macd", label: "MACD" },
  { id: "rsi", label: "RSI" },
  { id: "stoch", label: "Stoch" },
  { id: "williamsR", label: "W%R" },
  { id: "adx", label: "ADX" },
  { id: "roc", label: "ROC" },
];

export function TradingViewChart({
  symbol,
  name,
  exchange,
  className,
  indicators = DEFAULT_INDICATORS,
  rangeDays = 270,
  priceHeightClassName = "h-[390px]",
  theme = "dark",
  anchorPrice,
  showIndicatorControls = true,
  signalInsight: signalInsightProp,
  loadSignalInsight = false,
  currency: currencyProp,
}: Props) {
  const priceRef = useRef<HTMLDivElement | null>(null);
  const macdRef = useRef<HTMLDivElement | null>(null);
  const oscRef = useRef<HTMLDivElement | null>(null);
  const obvRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<ChartResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [localIndicators, setLocalIndicators] = useState<ChartIndicator[]>(indicators);
  const [fetchedInsight, setFetchedInsight] = useState<ChartSignalInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState(false);

  const showInsightStrip = signalInsightProp !== undefined || loadSignalInsight;
  const displayInsight =
    signalInsightProp !== undefined ? signalInsightProp : fetchedInsight;
  const resolvedCurrency = currencyProp ?? instrumentCurrency(symbol);

  useEffect(() => {
    setLocalIndicators(indicators);
  }, [indicators]);

  const activeIndicators = showIndicatorControls ? localIndicators : indicators;
  const chartKey = useMemo(() => activeIndicators.join(","), [activeIndicators]);

  function toggleIndicator(id: ChartIndicator) {
    setLocalIndicators((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  /** Single primitive key avoids dev/HMR "dependency array changed size" when optional deps appear later. */
  const chartFetchKey = `${symbol}:${rangeDays}:${anchorPrice ?? ""}`;
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError(null);
    const qs = new URLSearchParams({ days: String(rangeDays) });
    if (anchorPrice && anchorPrice > 0) qs.set("anchor", String(anchorPrice));
    fetch(`/api/chart/${encodeURIComponent(symbol)}?${qs.toString()}`, { signal: controller.signal })
      .then(async (r) => {
        const json = await r.json() as ChartResponse;
        if (!r.ok || !json.bars?.length) throw new Error(json.error || `No chart data for ${symbol}`);
        setData(json);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      });
    return () => controller.abort();
  }, [chartFetchKey]);

  const signalFetchKey = `${symbol}:${loadSignalInsight ? 1 : 0}:${signalInsightProp !== undefined ? 1 : 0}:${anchorPrice ?? ""}`;
  useEffect(() => {
    if (!loadSignalInsight || signalInsightProp !== undefined) {
      setFetchedInsight(null);
      setInsightLoading(false);
      setInsightError(false);
      return;
    }
    const ac = new AbortController();
    setInsightLoading(true);
    setInsightError(false);
    setFetchedInsight(null);
    const sigQs = new URLSearchParams();
    if (anchorPrice && anchorPrice > 0) sigQs.set("anchor", String(anchorPrice));
    const sigUrl = `/api/signal/${encodeURIComponent(symbol)}${sigQs.toString() ? `?${sigQs}` : ""}`;
    fetch(sigUrl, { signal: ac.signal })
      .then(async (r) => {
        const json = (await r.json()) as RealSignal & { error?: string };
        if (!r.ok || json.error) throw new Error(json.error || "signal failed");
        setFetchedInsight(insightFromRealSignal(json));
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setInsightError(true);
        setFetchedInsight(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setInsightLoading(false);
      });
    return () => ac.abort();
  }, [signalFetchKey]);

  useEffect(() => {
    if (status !== "ready" || !data?.bars?.length || !priceRef.current) return;
    return buildChart(
      priceRef.current,
      { macd: macdRef.current, osc: oscRef.current, obv: obvRef.current },
      data.bars,
      activeIndicators,
      theme,
      resolvedCurrency
    );
  }, [data, status, chartKey, theme, activeIndicators, resolvedCurrency]);

  const last = data?.bars?.at(-1);
  const change = data?.bars ? pctChange(data.bars) : 0;
  const positive = change >= 0;

  return (
    <div className={cn(
      "overflow-hidden rounded-xl shadow-sm",
      theme === "dark"
        ? "border border-white/10 bg-slate-950 text-white"
        : "border border-slate-200 bg-white text-slate-900",
      className
    )}>
      <div className={cn(
        "flex items-start justify-between gap-3 px-4 py-3",
        theme === "dark" ? "border-b border-white/10" : "border-b border-slate-200"
      )}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold">{symbol}</span>
            <span className={cn("text-xs font-semibold", theme === "dark" ? "text-slate-400" : "text-slate-500")}>{name ?? symbol}</span>
            <span
              className={cn(
                "rounded border px-1.5 py-px text-[10px] font-bold",
                theme === "dark" ? "border-white/15 bg-white/5 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"
              )}
            >
              {resolvedCurrency}
            </span>
            <span className={cn("text-[10px] uppercase", theme === "dark" ? "text-slate-500" : "text-slate-400")}>1D · {exchange ?? "Market"}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {activeIndicators.map((id) => (
              <span
                key={id}
                className={cn(
                  id === "ema20" && "text-sky-500",
                  id === "ema50" && "text-amber-500",
                  id === "rsi" && "text-violet-600",
                  id === "bollinger" && "text-purple-500",
                  id === "macd" && "text-blue-400",
                  id === "vwap" && "text-cyan-400",
                  id === "atr" && "text-slate-400",
                  id === "stoch" && "text-sky-400",
                  id === "williamsR" && "text-emerald-400",
                  id === "adx" && "text-fuchsia-400",
                  id === "roc" && "text-teal-400",
                  id === "obv" && "text-slate-400",
                  ![
                    "ema20",
                    "ema50",
                    "rsi",
                    "bollinger",
                    "macd",
                    "vwap",
                    "atr",
                    "stoch",
                    "williamsR",
                    "adx",
                    "roc",
                    "obv",
                  ].includes(id) && "text-slate-500"
                )}
              >
                {id === "williamsR" ? "W%R" : id.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
        {last && (
          <div className="text-right">
            <p className="font-mono text-lg font-bold tabular-nums">{formatInstrumentPrice(last.close, resolvedCurrency)}</p>
            <p className={cn("font-mono text-xs font-semibold", positive ? "text-emerald-600" : "text-rose-600")}>
              {positive ? "+" : ""}{change.toFixed(2)}%
            </p>
          </div>
        )}
      </div>

      {showInsightStrip && (
        <SignalInsightStrip
          insight={displayInsight}
          loading={loadSignalInsight && signalInsightProp === undefined && insightLoading}
          error={loadSignalInsight && signalInsightProp === undefined && insightError}
          theme={theme}
        />
      )}

      {showIndicatorControls && (
        <div className={cn(
          "flex flex-wrap items-center gap-1.5 border-b px-4 py-2",
          theme === "dark" ? "border-white/10 bg-black" : "border-slate-200 bg-slate-50"
        )}>
          <span className={cn("mr-1 text-[10px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-slate-600" : "text-slate-500")}>
            Indicators
          </span>
          {INDICATOR_OPTIONS.map((item) => {
            const active = activeIndicators.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleIndicator(item.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition",
                  active
                    ? theme === "dark"
                      ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-200"
                      : "border-cyan-500/40 bg-cyan-50 text-cyan-700"
                    : theme === "dark"
                      ? "border-white/10 text-slate-500 hover:border-white/20 hover:text-white"
                      : "border-slate-200 text-slate-500 hover:text-slate-900"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {status === "loading" && (
        <div className={cn("flex h-[540px] items-center justify-center gap-2 text-sm", theme === "dark" ? "text-slate-500" : "text-slate-500")}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading chart…
        </div>
      )}

      {status === "error" && (
        <div className={cn("flex h-[540px] flex-col items-center justify-center gap-2 text-center text-sm", theme === "dark" ? "text-slate-500" : "text-slate-500")}>
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <p>No chart data available</p>
          <p className="max-w-xs text-xs text-slate-400">{error}</p>
        </div>
      )}

      <div className={cn(status === "ready" ? "block" : "hidden")}>
        <div ref={priceRef} className={priceHeightClassName} />
        {activeIndicators.includes("macd") && (
          <>
            <div
              className={cn(
                "border-t px-2 py-1 text-[10px] font-medium",
                theme === "dark" ? "border-white/10 bg-slate-900 text-slate-500" : "border-slate-200 bg-slate-50 text-slate-500"
              )}
            >
              MACD (12, 26, 9)
            </div>
            <div
              ref={macdRef}
              className={cn("h-[130px]", theme === "dark" ? "bg-slate-950" : "bg-slate-50/80")}
            />
          </>
        )}
        {OSCILLATOR_IDS.some((id) => activeIndicators.includes(id)) && (
          <>
            <div
              className={cn(
                "border-t px-2 py-1 text-[10px] font-medium",
                theme === "dark" ? "border-white/10 bg-slate-900 text-slate-500" : "border-slate-200 bg-violet-50/60 text-slate-500"
              )}
            >
              Oscillators
              {activeIndicators.includes("roc") && (
                <span className="ml-2 text-slate-600">· ROC % on left scale</span>
              )}
            </div>
            <div
              ref={oscRef}
              className={cn("h-[160px]", theme === "dark" ? "bg-slate-950" : "bg-violet-50/40")}
            />
          </>
        )}
        {activeIndicators.includes("obv") && (
          <>
            <div
              className={cn(
                "border-t px-2 py-1 text-[10px] font-medium",
                theme === "dark" ? "border-white/10 bg-slate-900 text-slate-500" : "border-slate-200 bg-slate-50 text-slate-500"
              )}
            >
              OBV
            </div>
            <div
              ref={obvRef}
              className={cn("h-[110px]", theme === "dark" ? "bg-slate-950" : "bg-slate-50/80")}
            />
          </>
        )}
      </div>

      <div className={cn(
        "flex items-center gap-3 border-t px-4 py-2 text-[10px]",
        theme === "dark" ? "border-white/10 text-slate-500" : "border-slate-200 text-slate-500"
      )}>
        <span>1D</span>
        <span>5D</span>
        <span>1M</span>
        <span>3M</span>
        <span>6M</span>
        <span>YTD</span>
        <span>1Y</span>
        <span className="ml-auto">{data?.source ?? "Market data"}</span>
      </div>
    </div>
  );
}
