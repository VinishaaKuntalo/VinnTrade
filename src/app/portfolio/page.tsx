import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PortfolioWorkspace } from "@/components/portfolio/portfolio-workspace";

export const metadata: Metadata = {
  title: "Portfolio — VinnTrade",
  description: "Import holdings, connect brokers, and view portfolio risk through VinnTrade.",
};

export default function PortfolioPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-white/5 bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200/90">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Portfolio import · Broker connect readiness
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Portfolio
            </h1>
            <p className="mt-2 max-w-2xl text-base text-slate-400">
              Import holdings from CSV today, then connect broker providers once
              OAuth/gateway credentials are configured. Overlay risk scores and
              chart links on every position.
            </p>
          </div>
        </section>
        <PortfolioWorkspace />
      </main>
      <SiteFooter />
    </div>
  );
}
