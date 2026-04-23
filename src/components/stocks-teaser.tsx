import Link from "next/link";
import { ArrowRight, Zap, TrendingUp, TrendingDown, Minus } from "lucide-react";

const preview = [
  { symbol: "LMT",  name: "Lockheed Martin",     dir: "BUY"  as const, conf: 86, event: "Pentagon restocking order triggers supply chain surge" },
  { symbol: "XOM",  name: "ExxonMobil",           dir: "BUY"  as const, conf: 81, event: "Strait of Hormuz naval patrol intensified" },
  { symbol: "HSI",  name: "Hang Seng (proxy)",    dir: "SELL" as const, conf: 87, event: "US-China tech decoupling accelerates" },
  { symbol: "NVDA", name: "NVIDIA",               dir: "BUY"  as const, conf: 78, event: "Advanced chip export controls expanded" },
  { symbol: "PG",   name: "Procter & Gamble",     dir: "HOLD" as const, conf: 62, event: "Input cost inflation — energy & packaging" },
];

const DirChip = ({ dir }: { dir: "BUY" | "SELL" | "HOLD" }) => {
  const styles = {
    BUY:  "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    SELL: "border-rose-500/40 bg-rose-500/15 text-rose-300",
    HOLD: "border-slate-500/30 bg-slate-500/10 text-slate-400",
  };
  const icons = {
    BUY:  <TrendingUp className="h-3 w-3" />,
    SELL: <TrendingDown className="h-3 w-3" />,
    HOLD: <Minus className="h-3 w-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold ${styles[dir]}`}>
      {icons[dir]}{dir}
    </span>
  );
};

export function StocksTeaser() {
  return (
    <section id="stocks" className="border-b border-white/5 bg-slate-900/50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200/90">
              <Zap className="h-3.5 w-3.5" />
              503 S&amp;P 500 signals · Updated daily (demo)
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              BUY / SELL / HOLD for every S&amp;P 500 stock
            </h2>
            <p className="mt-2 text-slate-400">
              Every constituent gets a directional signal, confidence score,
              bull/bear strength bars, a geopolitical triggering event, and a
              full trade structure — entry, stop loss, target, and R/R ratio.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/signals"
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                Open AI Signals
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/stocks"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10"
              >
                Risk browser
              </Link>
            </div>
          </div>

          {/* preview cards */}
          <div className="w-full max-w-sm shrink-0 space-y-2">
            {preview.map((s) => (
              <div
                key={s.symbol}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-slate-950/60 px-4 py-3"
              >
                <div className="w-14 min-w-0">
                  <p className="font-mono text-sm font-bold text-white">{s.symbol}</p>
                  <p className="text-[10px] text-slate-500 truncate">{s.name}</p>
                </div>
                <DirChip dir={s.dir} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 truncate leading-tight">{s.event}</p>
                </div>
                <span className={`shrink-0 font-bold tabular-nums text-sm ${s.dir === "BUY" ? "text-emerald-300" : s.dir === "SELL" ? "text-rose-300" : "text-slate-400"}`}>
                  {s.conf}%
                </span>
              </div>
            ))}
            <Link
              href="/signals"
              className="block text-center text-xs text-cyan-400 hover:text-cyan-300 pt-1 transition"
            >
              See all 503 signals →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
