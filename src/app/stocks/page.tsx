import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StocksBrowserLoader } from "@/components/stocks/stocks-browser-loader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stock Risk Analysis — VinnTrade",
  description:
    "Browse S&P 500 constituents with a geopolitical and macro risk lens. Understand where your holdings sit in the current environment.",
};

export default function StocksPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-white/5 bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200/90">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Educational · Demo risk scores · Not financial advice
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              S&amp;P 500 — Geopolitical &amp; Macro Risk Browser
            </h1>
            <p className="mt-2 max-w-2xl text-slate-400 text-base">
              All 503 current constituents with a structured multi-factor risk
              profile. Scores are derived from sector, sub-industry, and
              headquarters geography — a thinking framework, not a price target.
            </p>
          </div>
        </section>
        <StocksBrowserLoader />
      </main>
      <SiteFooter />
    </div>
  );
}
