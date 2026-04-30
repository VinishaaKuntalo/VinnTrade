"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import {
  countryMarkets,
  findCountryMarket,
  RISK_COLORS,
  RISK_LABEL,
  type CountryMarket,
  type CountryStock,
} from "@/data/country-markets";
import { brokers, type Broker } from "@/data/brokers";
import { useCountryStocks, type QuoteMap } from "@/hooks/use-country-stocks";
import { StockChartModal } from "@/components/geo-map/stock-chart-modal";
import { cn } from "@/lib/cn";
import {
  X,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Globe,
  ShieldAlert,
  BarChart3,
  ExternalLink,
  Check,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ─── helpers ──────────────────────────────────────────────────────────────────

function riskFillColor(geoName: string, hovered: boolean): string {
  const country = findCountryMarket(geoName);
  if (!country) return hovered ? "#334155" : "#1e293b";
  const base = RISK_COLORS[country.riskLevel];
  return hovered ? base + "dd" : base + "66";
}

function formatChange(v: number) {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function MapLegend() {
  const levels: Array<{ label: string; color: string }> = [
    { label: "Critical ≥80", color: RISK_COLORS.critical },
    { label: "High 70–79", color: RISK_COLORS.high },
    { label: "Elevated 60–69", color: RISK_COLORS.elevated },
    { label: "Medium 45–59", color: RISK_COLORS.medium },
    { label: "Low <45", color: RISK_COLORS.low },
  ];
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 backdrop-blur">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        Risk Level
      </p>
      <div className="flex flex-col gap-1.5">
        {levels.map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: l.color + "cc" }}
            />
            <span className="text-[10px] text-slate-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Risk bar ─────────────────────────────────────────────────────────────────

function RiskBar({ value, level }: { value: number; level: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{
            width: `${value}%`,
            background: RISK_COLORS[level as keyof typeof RISK_COLORS] ?? "#3b82f6",
          }}
        />
      </div>
      <span
        className="w-14 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider"
        style={{ color: RISK_COLORS[level as keyof typeof RISK_COLORS] }}
      >
        {value}/100
      </span>
    </div>
  );
}

// ─── Stock card ───────────────────────────────────────────────────────────────

function StockCard({
  stock,
  quoteMap,
  onViewChart,
}: {
  stock: CountryStock;
  quoteMap: QuoteMap;
  onViewChart: (stock: CountryStock, livePrice?: number, liveChange?: number) => void;
}) {
  const sym = stock.symbol.toUpperCase();
  const quote = quoteMap[sym];
  const isLoading = !quote || quote.status === "loading";
  const isLive = quote?.status === "ok";
  const isStale = quote?.status === "stale";  // seed price shown, live loading in bg
  const hasPrice = isLive || isStale;

  const price = hasPrice ? (quote as { data: { price: number } }).data.price : stock.price;
  const change = hasPrice ? (quote as { data: { change: number } }).data.change : stock.change;
  const positive = change >= 0;

  return (
    <div className="group relative rounded-xl border border-white/8 bg-slate-900/60 p-3.5 transition hover:border-white/15 hover:bg-slate-900/80">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold text-slate-100">
              {stock.symbol}
            </span>
            <span className="rounded border border-white/10 px-1.5 py-px text-[9px] font-medium text-slate-500">
              {stock.exchange}
            </span>
            {isLive && (
              <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-px text-[9px] font-semibold text-emerald-400">
                LIVE
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-slate-400">
            {stock.name}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-600">{stock.sector}</p>
        </div>

        <div className="shrink-0 text-right">
          {isLoading ? (
            <div className="space-y-1.5">
              <div className="h-4 w-16 animate-pulse rounded bg-slate-700/60" />
              <div className="h-3 w-12 animate-pulse rounded bg-slate-700/40 ml-auto" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-end gap-1.5">
                <p className="font-mono text-sm font-semibold text-slate-100">
                  ${price.toFixed(2)}
                </p>
                {isLive && (
                  <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-px text-[9px] font-semibold text-emerald-400">
                    LIVE
                  </span>
                )}
                {isStale && (
                  <RefreshCw className="h-2.5 w-2.5 animate-spin text-slate-600" />
                )}
              </div>
              <p
                className={cn(
                  "mt-0.5 flex items-center justify-end gap-0.5 font-mono text-xs font-medium",
                  positive ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {formatChange(change)}
              </p>
            </>
          )}
          <p className="mt-0.5 text-[10px] text-slate-600">
            {stock.marketCap}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onViewChart(
            stock,
            isLive ? (quote as { data: { price: number } }).data.price : undefined,
            isLive ? (quote as { data: { change: number } }).data.change : undefined
          )
        }
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/8 py-1.5 text-[11px] font-medium text-cyan-300 transition hover:border-cyan-500/50 hover:bg-cyan-500/15 hover:text-cyan-200"
      >
        <BarChart3 className="h-3 w-3" />
        View Chart &amp; Signals
      </button>
    </div>
  );
}

// ─── Country panel ────────────────────────────────────────────────────────────

function CountryPanel({
  country,
  onClose,
  onViewChart,
}: {
  country: CountryMarket;
  onClose: () => void;
  onViewChart: (stock: CountryStock, livePrice?: number, liveChange?: number) => void;
}) {
  const symbols = useMemo(
    () => country.topStocks.map((s) => s.symbol),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [country.code]
  );

  // Pass static seed prices so UI is never blank while live data loads
  const seeds = useMemo(() => {
    const map: Record<string, { price: number; change: number }> = {};
    for (const s of country.topStocks) map[s.symbol.toUpperCase()] = { price: s.price, change: s.change };
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country.code]);

  const quoteMap = useCountryStocks(symbols, seeds);

  const liveCount = Object.values(quoteMap).filter(
    (q) => q.status === "ok"
  ).length;
  const updatingCount = Object.values(quoteMap).filter(
    (q) => q.status === "stale" || q.status === "loading"
  ).length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/8 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: RISK_COLORS[country.riskLevel] + "22",
                color: RISK_COLORS[country.riskLevel],
                border: `1px solid ${RISK_COLORS[country.riskLevel]}44`,
              }}
            >
              {RISK_LABEL[country.riskLevel]}
            </span>
            <span className="text-[10px] text-slate-500">{country.region}</span>
            <span className="font-mono text-[10px] text-slate-600">
              {country.currency}
            </span>
          </div>
          <h2 className="mt-1.5 text-lg font-semibold text-white">
            {country.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/8 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* risk score */}
        <div className="rounded-xl border border-white/8 bg-slate-950/40 p-3.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Geopolitical Risk Score
          </p>
          <RiskBar value={country.riskScore} level={country.riskLevel} />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {country.riskDrivers.map((d) => (
              <span
                key={d}
                className="rounded-full border border-white/8 bg-white/5 px-2 py-px text-[10px] text-slate-400"
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* market summary */}
        <div className="rounded-xl border border-white/8 bg-slate-950/40 p-3.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Market Overview
            </p>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            {country.marketSummary}
          </p>
          <p className="mt-2 text-[10px] text-slate-600">
            Indices: {country.indices.join(" · ")}
          </p>
        </div>

        {/* top stocks */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Top Stocks / ADRs
            </p>
            <div className="flex items-center gap-2">
              {liveCount > 0 && (
                <span className="flex items-center gap-1 rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-px text-[9px] font-semibold text-emerald-400">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                  {liveCount} live
                </span>
              )}
              {updatingCount > 0 && (
                <span className="flex items-center gap-1 rounded border border-slate-600 bg-slate-800/50 px-1.5 py-px text-[9px] text-slate-500">
                  <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                  updating
                </span>
              )}
              <span className="text-[10px] text-slate-600">
                {country.topStocks.length} stocks
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {country.topStocks.map((s) => (
              <StockCard
                key={s.symbol}
                stock={s}
                quoteMap={quoteMap}
                onViewChart={onViewChart}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-800/60">
        <Globe className="h-6 w-6 text-slate-500" />
      </div>
      <p className="text-sm font-medium text-slate-400">Select a country</p>
      <p className="mt-1.5 max-w-[180px] text-xs leading-relaxed text-slate-600">
        Click any highlighted country on the map to see its top stocks and risk profile
      </p>
      <div className="mt-6 space-y-2 w-full max-w-[220px]">
        {countryMarkets.slice(0, 5).map((c) => (
          <div
            key={c.code}
            className="flex items-center justify-between rounded-lg border border-white/6 bg-white/3 px-3 py-2"
          >
            <span className="text-xs text-slate-400">{c.name.split(" ")[0]}{c.name.includes("of") ? "..." : ""}</span>
            <span
              className="text-[10px] font-bold"
              style={{ color: RISK_COLORS[c.riskLevel] }}
            >
              {c.riskScore}
            </span>
          </div>
        ))}
        <p className="text-[10px] text-slate-700 text-center pt-1">
          +{countryMarkets.length - 5} more countries
        </p>
      </div>
    </div>
  );
}

// ─── Broker Modal ─────────────────────────────────────────────────────────────

type PortfolioStep = "select-broker" | "confirm";

function BrokerCard({
  broker,
  onSelect,
}: {
  broker: Broker;
  onSelect: (b: Broker) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(broker)}
      className="group flex flex-col gap-2.5 rounded-xl border border-white/8 bg-slate-900/60 p-4 text-left transition hover:border-white/20 hover:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div
            className="mb-1 text-sm font-bold"
            style={{ color: broker.accentColor }}
          >
            {broker.shortName}
          </div>
          <p className="text-[11px] leading-snug text-slate-400">
            {broker.tagline}
          </p>
        </div>
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-slate-400" />
      </div>

      <div className="flex flex-wrap gap-1">
        {broker.features.slice(0, 3).map((f) => (
          <span
            key={f}
            className="rounded-full border border-white/8 bg-white/4 px-2 py-px text-[9px] text-slate-500"
          >
            {f}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-white/6 pt-2.5 text-[10px] text-slate-500">
        <span>Min: <span className="text-slate-300">{broker.minDeposit}</span></span>
        <span>·</span>
        <span>Fees: <span className="text-slate-300">{broker.commissions}</span></span>
        {broker.fractional && (
          <>
            <span>·</span>
            <span className="text-emerald-500/80">Fractional</span>
          </>
        )}
      </div>
    </button>
  );
}

function PortfolioBrokerModal({
  stock,
  livePrice,
  liveChange,
  country,
  onClose,
}: {
  stock: CountryStock;
  livePrice?: number;
  liveChange?: number;
  country: CountryMarket;
  onClose: () => void;
}) {
  const [step, setStep] = useState<PortfolioStep>("select-broker");
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);

  const handleSelectBroker = useCallback((b: Broker) => {
    setSelectedBroker(b);
    setStep("confirm");
  }, []);

  const displayPrice = livePrice ?? stock.price;
  const displayChange = liveChange ?? stock.change;
  const positive = displayChange >= 0;
  const isLive = livePrice !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* sheet */}
      <div className="relative w-full sm:max-w-2xl max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-2xl border border-white/10 bg-slate-900 shadow-2xl flex flex-col">
        {/* drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/10" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-3">
            {step === "confirm" && (
              <button
                type="button"
                onClick={() => setStep("select-broker")}
                className="rounded-lg p-1 text-slate-500 transition hover:bg-white/8 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <p className="text-xs text-slate-500">
                {step === "select-broker" ? "Add to portfolio" : "Confirm & Open Broker"}
              </p>
              <h3 className="text-base font-semibold text-white">
                {stock.symbol} — {stock.name}
              </h3>
            </div>
          </div>

          {/* stock badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="flex items-center justify-end gap-1.5">
                <p className="font-mono text-sm font-semibold text-slate-100">
                  ${displayPrice.toFixed(2)}
                </p>
                {isLive && (
                  <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-1 py-px text-[9px] font-semibold text-emerald-400">
                    LIVE
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "font-mono text-xs",
                  positive ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {formatChange(displayChange)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/8 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* step: select broker */}
        {step === "select-broker" && (
          <div className="flex-1 overflow-y-auto p-5">
            {/* context */}
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/8 bg-slate-800/40 p-3.5">
              <ShieldAlert
                className="h-5 w-5 shrink-0"
                style={{ color: RISK_COLORS[country.riskLevel] }}
              />
              <div>
                <p className="text-xs font-medium text-slate-300">
                  {country.name} risk: <span className="font-bold" style={{ color: RISK_COLORS[country.riskLevel] }}>
                    {RISK_LABEL[country.riskLevel]} ({country.riskScore}/100)
                  </span>
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Factor in regional risk when sizing this position
                </p>
              </div>
            </div>

            <p className="mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Choose your broker
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {brokers.map((b) => (
                <BrokerCard key={b.id} broker={b} onSelect={handleSelectBroker} />
              ))}
            </div>
          </div>
        )}

        {/* step: confirm */}
        {step === "confirm" && selectedBroker && (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="mx-auto max-w-md">
              {/* broker card */}
              <div className="mb-6 rounded-xl border border-white/10 bg-slate-800/40 p-5">
                <div
                  className="mb-1 text-xl font-black"
                  style={{ color: selectedBroker.accentColor }}
                >
                  {selectedBroker.name}
                </div>
                <p className="text-sm text-slate-400">{selectedBroker.tagline}</p>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg border border-white/8 bg-slate-900/60 py-2.5">
                    <p className="text-xs font-semibold text-slate-100">{selectedBroker.minDeposit}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">Min Deposit</p>
                  </div>
                  <div className="rounded-lg border border-white/8 bg-slate-900/60 py-2.5">
                    <p className="text-xs font-semibold text-slate-100">{selectedBroker.commissions}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">Commissions</p>
                  </div>
                  <div className="rounded-lg border border-white/8 bg-slate-900/60 py-2.5">
                    <p className="text-xs font-semibold text-slate-100">
                      {selectedBroker.fractional ? "Yes" : "No"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">Fractional</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {selectedBroker.features.map((f) => (
                    <span
                      key={f}
                      className="flex items-center gap-1 rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-[10px] text-slate-400"
                    >
                      <Check className="h-2.5 w-2.5 text-emerald-400" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* trade summary */}
              <div className="mb-5 rounded-xl border border-white/8 bg-slate-950/40 p-4 space-y-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Position Summary
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Symbol</span>
                  <span className="font-mono font-semibold text-slate-100">{stock.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    {isLive ? "Live Price" : "Last Price"}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-slate-100">
                    ${displayPrice.toFixed(2)}
                    {isLive && (
                      <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-1 py-px text-[9px] font-semibold text-emerald-400">
                        LIVE
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Today&apos;s Change</span>
                  <span
                    className={cn(
                      "font-mono",
                      displayChange >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {formatChange(displayChange)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Market Cap</span>
                  <span className="font-mono text-slate-100">{stock.marketCap}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Country Risk</span>
                  <span
                    className="font-semibold"
                    style={{ color: RISK_COLORS[country.riskLevel] }}
                  >
                    {RISK_LABEL[country.riskLevel]}
                  </span>
                </div>
              </div>

              <a
                href={`${selectedBroker.url}?ref=vinntrade`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: selectedBroker.accentColor }}
              >
                Open in {selectedBroker.shortName}
                <ExternalLink className="h-4 w-4" />
              </a>

              <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-600">
                VinnTrade is not a broker. This link takes you to{" "}
                {selectedBroker.name}&apos;s platform. Geopolitical risk analysis
                is for educational purposes only.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Map tooltip ──────────────────────────────────────────────────────────────

function MapTooltip({
  name,
  x,
  y,
}: {
  name: string;
  x: number;
  y: number;
}) {
  const country = findCountryMarket(name);
  return (
    <div
      className="pointer-events-none fixed z-20 rounded-lg border border-white/15 bg-slate-900/95 px-3 py-2 shadow-xl backdrop-blur"
      style={{ left: x + 12, top: y - 8 }}
    >
      <p className="text-xs font-semibold text-slate-100">{name}</p>
      {country ? (
        <div className="mt-1 flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: RISK_COLORS[country.riskLevel] }}
          />
          <span
            className="text-[10px] font-medium"
            style={{ color: RISK_COLORS[country.riskLevel] }}
          >
            {RISK_LABEL[country.riskLevel]} · {country.riskScore}/100
          </span>
        </div>
      ) : (
        <p className="mt-0.5 text-[10px] text-slate-600">No coverage</p>
      )}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

interface StockEntry {
  stock: CountryStock;
  livePrice?: number;
  liveChange?: number;
}

export function GeoMapView() {
  const [selectedCountry, setSelectedCountry] = useState<CountryMarket | null>(null);
  const [hoveredGeo, setHoveredGeo] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [chartEntry, setChartEntry] = useState<StockEntry | null>(null);
  const [portfolioEntry, setPortfolioEntry] = useState<StockEntry | null>(null);

  const handleGeoClick = useCallback((geoName: string) => {
    const country = findCountryMarket(geoName);
    if (country) setSelectedCountry(country);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleViewChart = useCallback(
    (stock: CountryStock, livePrice?: number, liveChange?: number) => {
      setChartEntry({ stock, livePrice, liveChange });
    },
    []
  );

  return (
    <div
      className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-4rem)] overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* ── Map panel ── */}
      <div className="relative flex-1 min-h-[55vw] lg:min-h-0 bg-gradient-to-b from-slate-950 to-slate-900/50 overflow-hidden">
        {/* header bar */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-slate-300">
              Market Impact Map
            </span>
            <span className="ml-2 rounded border border-white/8 px-1.5 py-px text-[9px] text-slate-600">
              {countryMarkets.length} markets
            </span>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-[10px] text-slate-500 backdrop-blur hidden sm:block">
            Click a country · scroll to zoom
          </div>
        </div>

        <ComposableMap
          projection="geoMercator"
          className="h-full w-full"
          projectionConfig={{ scale: 130, center: [10, 20] }}
        >
          <ZoomableGroup zoom={1} minZoom={0.6} maxZoom={8}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name: string = geo.properties?.name ?? "";
                  const country = findCountryMarket(name);
                  const isSelected = selectedCountry?.name === country?.name;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => handleGeoClick(name)}
                      onMouseEnter={() => setHoveredGeo(name)}
                      onMouseLeave={() => setHoveredGeo(null)}
                      style={{
                        default: {
                          fill: isSelected
                            ? (country ? RISK_COLORS[country.riskLevel] : "#475569")
                            : riskFillColor(name, false),
                          stroke: isSelected ? "#fff" : "#0f172a",
                          strokeWidth: isSelected ? 0.8 : 0.3,
                          outline: "none",
                          cursor: country ? "pointer" : "default",
                          filter: isSelected
                            ? `drop-shadow(0 0 6px ${country ? RISK_COLORS[country.riskLevel] : "#94a3b8"}88)`
                            : "none",
                          transition: "fill 150ms ease",
                        },
                        hover: {
                          fill: country
                            ? RISK_COLORS[country.riskLevel] + "cc"
                            : "#334155",
                          stroke: "#94a3b8",
                          strokeWidth: 0.5,
                          outline: "none",
                          cursor: country ? "pointer" : "default",
                          transition: "fill 100ms ease",
                        },
                        pressed: {
                          fill: country
                            ? RISK_COLORS[country.riskLevel]
                            : "#475569",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* legend */}
        <MapLegend />

        {/* tooltip */}
        {hoveredGeo && (
          <MapTooltip name={hoveredGeo} x={tooltipPos.x} y={tooltipPos.y} />
        )}
      </div>

      {/* ── Right panel ── */}
      <div
        className={cn(
          "w-full lg:w-[380px] xl:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/8 bg-slate-950 overflow-hidden flex flex-col",
          "transition-all duration-300"
        )}
      >
        {selectedCountry ? (
          <CountryPanel
            country={selectedCountry}
            onClose={() => setSelectedCountry(null)}
            onViewChart={handleViewChart}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* ── Chart modal ── */}
      {chartEntry && selectedCountry && (
        <StockChartModal
          stock={chartEntry.stock}
          countryRiskLevel={selectedCountry.riskLevel}
          livePrice={chartEntry.livePrice}
          liveChange={chartEntry.liveChange}
          onClose={() => setChartEntry(null)}
          onAddToPortfolio={() => {
            setPortfolioEntry(chartEntry);
            setChartEntry(null);
          }}
        />
      )}

      {/* ── Broker modal ── */}
      {portfolioEntry && selectedCountry && (
        <PortfolioBrokerModal
          stock={portfolioEntry.stock}
          livePrice={portfolioEntry.livePrice}
          liveChange={portfolioEntry.liveChange}
          country={selectedCountry}
          onClose={() => setPortfolioEntry(null)}
        />
      )}
    </div>
  );
}
