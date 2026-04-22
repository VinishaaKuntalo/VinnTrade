import { BookMarked } from "lucide-react";

const cards = [
  {
    kicker: "If you own broad indices",
    text: "Headline risk and drawdowns are not the same thing. The question is which macro channel is live—rates, oil, or credit—and whether your tilt amplifies that channel.",
  },
  {
    kicker: "If you build thematic sleeves",
    text: "Themes often share physical infrastructure. Mapping geography helps you see duplicate bets you did not know you were taking across funds and names.",
  },
  {
    kicker: "If you care about the next decade",
    text: "Political news cycles are faster than your pension. VinnTrade is framed so you can separate what is tradable for tourists vs material for allocators.",
  },
];

export function ForInvestorsSection() {
  return (
    <section
      id="learn"
      className="border-b border-white/5 bg-slate-900/30"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-start gap-3">
          <BookMarked
            className="mt-1 h-6 w-6 text-cyan-400/80"
            aria-hidden
          />
          <div>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Plain language for real portfolios
            </h2>
            <p className="mt-2 max-w-2xl text-slate-400">
              Wherever you are on the experience curve, the same world events
              land differently. These prompts are a starting line—not an exam.
            </p>
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((c) => (
            <article
              key={c.kicker}
              className="flex flex-col rounded-2xl border border-white/10 bg-slate-950/50 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
                {c.kicker}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {c.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
