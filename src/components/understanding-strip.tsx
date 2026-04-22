import { Globe2, LineChart, Network } from "lucide-react";

const items = [
  {
    icon: Globe2,
    title: "Start with how things connect",
    copy: "Wars, sanctions, and shipping are not abstractions. They re-route costs, policy, and cash flows. VinnTrade makes those channels visible in one place.",
  },
  {
    icon: Network,
    title: "Translate events into levers you own",
    copy: "Energy, semis, financials, and FX respond through different levers. We describe which levers are in play so you can match stories to your actual exposures.",
  },
  {
    icon: LineChart,
    title: "Investing is still about time horizon",
    copy: "Short-term volatility and long-term outcomes are different problems. The experience is designed to help you calibrate the right horizon for what you are seeing.",
  },
];

export function UnderstandingStrip() {
  return (
    <section className="border-b border-white/5 bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">
          What you are looking at
        </h2>
        <p className="mt-2 max-w-2xl text-slate-400">
          Three simple ideas. No jargon for its own sake—just enough to know why
          the globe exists on a site about investing.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-white/10 bg-slate-950/50 p-5"
            >
              <it.icon
                className="h-8 w-8 text-cyan-400/90"
                strokeWidth={1.5}
                aria-hidden
              />
              <h3 className="mt-4 text-base font-semibold text-slate-100">
                {it.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {it.copy}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
