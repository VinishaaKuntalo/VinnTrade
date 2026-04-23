"use client";

import dynamic from "next/dynamic";

const SignalsBrowser = dynamic(
  () => import("./signals-browser").then((m) => ({ default: m.SignalsBrowser })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="h-8 w-8 rounded-full bg-slate-800" />
          <div className="h-3 w-40 rounded bg-slate-800" />
          <p className="text-xs text-slate-600">Loading signals…</p>
        </div>
      </div>
    ),
  }
);

export function SignalsBrowserLoader() {
  return <SignalsBrowser />;
}
