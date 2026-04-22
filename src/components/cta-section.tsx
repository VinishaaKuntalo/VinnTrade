"use client";

export function CtaSection() {
  return (
    <section id="access" className="bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-slate-900 to-cyan-500/10 p-8 sm:p-12">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl"
            aria-hidden
          />
          <div className="relative max-w-2xl">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Help us build the investor-grade version of this map
            </h2>
            <p className="mt-2 text-slate-200/90">
              We are opening early access to people who can stress-test the
              experience with us: serious individuals, small teams, and
              research-minded advisors who want clarity without theatre.
            </p>
            <form
              className="mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
              onSubmit={(e) => e.preventDefault()}
            >
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
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
            <p className="mt-3 text-xs text-amber-100/60">
              No spam, no “hot stock” lists. This is a product research list,
              not a marketing funnel masquerading as research.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
