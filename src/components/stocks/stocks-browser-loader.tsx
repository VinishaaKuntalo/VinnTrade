"use client";

import dynamic from "next/dynamic";

const StocksBrowser = dynamic(
  () => import("./stocks-browser").then((m) => ({ default: m.StocksBrowser })),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="space-y-3 animate-pulse">
          <div className="h-10 w-80 rounded-lg bg-slate-800/60" />
          <div className="h-[520px] w-full rounded-2xl bg-slate-800/40" />
        </div>
      </div>
    ),
  }
);

export function StocksBrowserLoader() {
  return <StocksBrowser />;
}
