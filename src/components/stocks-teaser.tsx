import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import { RISK_BAND_COLOR } from "@/types/stocks";

const preview = [
  { symbol: "NVDA", name: "NVIDIA", sector: "IT", score: 74, band: "high" as const },
  { symbol: "XOM",  name: "ExxonMobil", sector: "Energy", score: 72, band: "high" as const },
  { symbol: "JPM",  name: "JPMorgan Chase", sector: "Financials", score: 63, band: "elevated" as const },
  { symbol: "JNJ",  name: "Johnson & Johnson", sector: "Health Care", score: 42, band: "moderate" as const },
  { symbol: "PG",   name: "Procter & Gamble", sector: "Staples", score: 28, band: "low" as const },
];

export function StocksTeaser() {
  return (
    <section id="stocks" className="border-b border-white/5 bg-slate-900/50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200/90">
              <BarChart3 className="h-3.5 w-3.5" />
              503 S&amp;P 500 stocks
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Every stock — with a geopolitical risk lens
            </h2>
            <p className="mt-2 text-slate-400">
              Browse all S&amp;P 500 constituents with multi-factor risk
              scores built from sector, sub-industry, and geographic
              exposure. Filter by band, sort by score, click any row for a
              full breakdown.
            </p>
            <Link
              href="/stocks"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
            >
              Open stock browser
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* mini preview table */}
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden shrink-0">
            <div className="px-4 py-2.5 border-b border-white/5 text-xs font-medium uppercase tracking-wider text-slate-500">
              Sample risk scores
            </div>
            <ul className="divide-y divide-white/5">
              {preview.map((s) => (
                <li key={s.symbol} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="font-mono text-sm font-semibold text-white w-12">{s.symbol}</span>
                  <span className="flex-1 text-xs text-slate-400 truncate">{s.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${s.score}%`,
                          background: RISK_BAND_COLOR[s.band],
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs text-slate-300 w-6 tabular-nums">{s.score}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-4 py-2 text-center border-t border-white/5">
              <Link href="/stocks" className="text-xs text-cyan-400 hover:text-cyan-300 transition">
                See all 503 stocks →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
