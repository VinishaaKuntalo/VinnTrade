"use client";

import { useState } from "react";
import { CheckCircle2, Globe2, ShieldCheck, Zap } from "lucide-react";

const WHY = [
  {
    icon: Globe2,
    title: "Cross-border clarity, not headlines",
    body: "See how a trade spat, a rate decision, or an energy shock propagates through sectors — before it shows up in your portfolio.",
  },
  {
    icon: Zap,
    title: "Signals that explain themselves",
    body: "Every BUY / SELL / HOLD names the geopolitical trigger, the channel it travels through, and the confidence level — so you can disagree intelligently.",
  },
  {
    icon: ShieldCheck,
    title: "Built for long-term capital, not day-trading",
    body: "No 'hot picks', no noise. The framework is designed for investors with a 3–24 month horizon who need context, not just price action.",
  },
];

export function CtaSection() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section id="access" className="bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-slate-900 to-cyan-500/10 p-8 sm:p-12">
          {/* glows */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl"
            aria-hidden
          />

          <div className="relative grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* ── LEFT: the ask ── */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-400/80">
                Early access
              </p>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Help us build the investor-grade version of this map
              </h2>
              <p className="mt-3 text-slate-300/80">
                We are opening early access to people who can stress-test the
                experience with us: serious individuals, small teams, and
                research-minded advisors who want clarity without theatre.
              </p>

              {submitted ? (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-emerald-200">
                        You're on the list.
                      </p>
                      <p className="text-xs text-emerald-300/60">
                        We'll be in touch within a few days — personally, not via a drip sequence.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-5 py-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      What happens next
                    </p>
                    <ol className="space-y-3">
                      {[
                        { step: "1", text: "We review your email and reach out to understand what you invest in and what tools you use today." },
                        { step: "2", text: "You get access to the private build — the full signals browser, risk scores, and the live globe — with no restrictions." },
                        { step: "3", text: "We ask you to break things. Flag what's unclear, wrong, or missing. Your feedback shapes what gets built next." },
                      ].map(({ step, text }) => (
                        <li key={step} className="flex gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-[10px] font-bold text-amber-300">
                            {step}
                          </span>
                          <p className="text-sm leading-relaxed text-slate-400">{text}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ) : (
                <form
                  className="mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
                  onSubmit={handleSubmit}
                >
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-full border border-white/15 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                  >
                    Join the waitlist
                  </button>
                </form>
              )}

              <p className="mt-3 text-xs text-amber-100/50">
                No spam, no "hot stock" lists. This is a product research list,
                not a marketing funnel masquerading as research.
              </p>
            </div>

            {/* ── RIGHT: the why ── */}
            <div className="flex flex-col justify-center gap-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Why join now
              </p>
              {WHY.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                    <Icon className="h-4 w-4 text-amber-300" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-100">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-400">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
