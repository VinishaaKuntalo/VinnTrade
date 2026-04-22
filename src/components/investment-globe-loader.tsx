"use client";

import dynamic from "next/dynamic";

const InvestmentGlobeSection = dynamic(
  () =>
    import("@/components/investment-globe-section").then((m) => ({
      default: m.InvestmentGlobeSection,
    })),
  {
    ssr: false,
    loading: () => (
      <section
        id="globe"
        className="border-b border-white/5 bg-slate-950"
        aria-hidden
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="h-10 max-w-sm animate-pulse rounded bg-slate-800/60" />
          <div className="mt-6 h-[min(62vh,560px)] w-full min-h-[300px] animate-pulse rounded-2xl bg-slate-800/50" />
          <p className="mt-3 text-center text-xs text-slate-500">
            Loading 3D map…
          </p>
        </div>
      </section>
    ),
  }
);

export function InvestmentGlobeLoader() {
  return <InvestmentGlobeSection />;
}
