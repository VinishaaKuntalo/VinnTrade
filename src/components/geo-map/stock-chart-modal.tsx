"use client";

import type { CountryStock } from "@/data/country-markets";
import { TradingViewChart } from "@/components/charts/trading-view-chart";
import { formatInstrumentPrice, instrumentCurrency } from "@/lib/instrument-currency";
import { cn } from "@/lib/cn";
import { TrendingDown, TrendingUp, X } from "lucide-react";

function formatChange(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

export function StockChartModal({
  stock,
  livePrice,
  liveChange,
  onClose,
}: {
  stock: CountryStock;
  countryRiskLevel: string;
  livePrice?: number;
  liveChange?: number;
  onClose: () => void;
  onAddToPortfolio: () => void;
}) {
  const displayPrice = livePrice ?? stock.price;
  const displayChange = liveChange ?? stock.change;
  const positive = displayChange >= 0;
  const ccy = instrumentCurrency(stock.symbol);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-full w-full max-w-6xl flex-col border-l border-white/10 bg-black shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-black px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-white">{stock.symbol}</span>
              <span className="rounded border border-white/10 bg-white/5 px-1.5 py-px text-[10px] font-semibold text-slate-400">
                {stock.exchange}
              </span>
              {livePrice && (
                <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-px text-[10px] font-semibold text-emerald-400">
                  LIVE QUOTE
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-sm text-slate-400">
              {stock.name} · {stock.sector}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right">
              <p className="font-mono text-xl font-bold text-white tabular-nums">
                {formatInstrumentPrice(displayPrice, ccy)}
              </p>
              <p
                className={cn(
                  "flex items-center justify-end gap-0.5 font-mono text-xs font-semibold",
                  positive ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatChange(displayChange)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
              aria-label="Close chart"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-black p-4">
          <TradingViewChart
            symbol={stock.symbol}
            name={stock.name}
            exchange={stock.exchange}
            rangeDays={365}
            anchorPrice={displayPrice}
            priceHeightClassName="h-[560px]"
            className="min-h-[760px] border-white/10"
            theme="dark"
            loadSignalInsight
            currency={ccy}
          />
        </div>
      </div>
    </div>
  );
}
