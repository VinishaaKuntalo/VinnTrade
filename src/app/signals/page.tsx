import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SignalsBrowserLoader } from "@/components/signals/signals-browser-loader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Signals — VinnTrade",
  description:
    "BUY / SELL / HOLD signals for all S&P 500 stocks, with confidence scores, trade setup, and geopolitical triggering events.",
};

export default function SignalsPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <SiteHeader />

      {/* Page intro — mirrors the stocks page header style */}
      <section className="shrink-0 border-b border-white/5 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="mx-auto max-w-7xl px-4 pb-5 pt-6 sm:px-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200/90">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Live data overlay · Educational · Not financial advice
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Market Signals Browser
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-400">
            BUY / SELL / HOLD signals across S&amp;P 500 stocks, commodities,
            forex, crypto, and more — with confidence scores, trade setup, and
            geopolitical triggering events.
          </p>
        </div>
      </section>

      {/* Full-height browser */}
      <main className="min-h-0 flex-1 overflow-hidden">
        <SignalsBrowserLoader />
      </main>

      <SiteFooter />
    </div>
  );
}
