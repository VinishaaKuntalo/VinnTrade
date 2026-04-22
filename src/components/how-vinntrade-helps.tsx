import { CheckCircle2 } from "lucide-react";

const steps = [
  {
    title: "1 · Map second-order effects, not just headlines",
    body: "VinnTrade is organized around the transmission mechanisms investors actually care about: costs of capital, input prices, and revenue geography.",
  },
  {
    title: "2 · See where your style of portfolio is most exposed",
    body: "Whether you are index-heavy, single-stock, or thematic, the goal is a repeatable checklist: which sectors, FX, and duration bets are in the same story.",
  },
  {
    title: "3 · Turn uncertainty into a research queue",
    body: "Instead of reacting to the feed, you get a set of what to read next and what to re-check in your statements—slower, calmer, more systematic.",
  },
  {
    title: "4 · Stay in your lane, legally and practically",
    body: "We are education-first. We do not know your personal situation, so we will never present noise as a personalized recommendation canvas.",
  },
];

export function HowVinnTradeHelps() {
  return (
    <section id="how" className="border-b border-white/5 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">
          How VinnTrade helps you invest with context
        </h2>
        <p className="mt-2 max-w-2xl text-slate-400">
          The product is designed to be honest about what it can and cannot
          do. It is not a crystal ball—it is a bridge between a complex world
          and the part of the world you are responsible for: your own plan.
        </p>
        <ol className="mt-10 space-y-4">
          {steps.map((s) => (
            <li
              key={s.title}
              className="flex gap-3 rounded-2xl border border-white/10 bg-slate-900/30 p-4 sm:p-5"
            >
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-400/90"
                aria-hidden
              />
              <div>
                <h3 className="font-medium text-slate-100">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
