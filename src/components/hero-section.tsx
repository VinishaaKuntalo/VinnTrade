import { ArrowRight, Shield } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(800px_400px_at_20%_0%,rgba(34,211,238,0.15),transparent),radial-gradient(600px_360px_at_80%_20%,rgba(251,191,36,0.12),transparent)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
        <div className="vinn-enter mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200/90">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60" />
          Clarity over noise · Built for long-term capital
        </div>
        <h1 className="vinn-enter vinn-delay-1 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-tight">
          When the world moves, your portfolio doesn’t have to be a
          black box.
        </h1>
        <p className="vinn-enter vinn-delay-2 mt-5 max-w-2xl text-pretty text-lg text-slate-400">
          VinnTrade links cross-border events to the channels that actually
          move markets—rates, energy, supply chains, and policy—so you can
          see what to watch, ask better questions, and invest with a map, not
          a mood.
        </p>
        <div className="vinn-enter vinn-delay-3 mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#globe"
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
          >
            Explore the live view
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:border-white/25 hover:bg-white/10"
          >
            How we help you decide
          </a>
        </div>
        <p className="vinn-enter vinn-delay-4 mt-6 flex max-w-2xl items-start gap-2 text-left text-sm text-slate-500">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <span>
            <strong className="font-medium text-slate-400">Educational only.</strong>{" "}
            Nothing here is an offer, solicitation, or personalized investment
            advice. Markets involve risk, including loss of principal.
          </span>
        </p>
      </div>
    </section>
  );
}
