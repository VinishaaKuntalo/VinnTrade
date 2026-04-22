import { mciSnapshot } from "@/data/pulse";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up")
    return <TrendingUp className="h-4 w-4 text-rose-300" aria-hidden />;
  if (trend === "down")
    return <TrendingDown className="h-4 w-4 text-emerald-300" aria-hidden />;
  return <Minus className="h-4 w-4 text-slate-400" aria-hidden />;
}

export function MciSnapshotBar() {
  const { value, trend, trendBps, asOf, blurb } = mciSnapshot;
  const when = new Date(asOf);
  return (
    <section
      id="pulse"
      className="border-b border-white/5 bg-slate-900/50"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Market Clarity Index (MCI)
            </p>
            <p className="mt-1 max-w-lg text-sm text-slate-400">
              A single, plain-English read on how “noisy” cross-border
              conditions are for diversified investors right now. Higher
              means more second-order effects to map—not necessarily lower
              returns.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-6 sm:gap-10">
            <div>
              <p className="text-xs text-slate-500">As of (UTC)</p>
              <p className="mt-0.5 font-mono text-sm text-slate-200">
                {when.toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold tabular-nums tracking-tight text-white sm:text-5xl">
                {value.toFixed(1)}
              </span>
              <span className="text-slate-500">/ 100</span>
              <span
                className="ml-1 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-200"
                title="Week-over-week change in index points (demo)"
              >
                <TrendIcon trend={trend} />
                {trendBps / 10 > 0 ? "+" : ""}
                {(trendBps / 10).toFixed(1)} pts
              </span>
            </div>
          </div>
        </div>
        <p className="mt-6 rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-300">
          {blurb}
        </p>
      </div>
    </section>
  );
}
