"use client";

import { useMemo, useState } from "react";
import { flowArcs, hotspots, signalFeed } from "@/data/hotspots";
import type { EventCategory, Hotspot } from "@/types/vinntrade";
import { EVENT_CATEGORY_LABEL } from "@/types/vinntrade";
import { GlobeCanvas } from "@/components/globe-canvas";
import { categoryHex } from "@/lib/globe-theme";
import { Radio, Megaphone } from "lucide-react";
import { cn } from "@/lib/cn";

const filters: { id: "all" | EventCategory; label: string }[] = [
  { id: "all", label: "All drivers" },
  { id: "military", label: EVENT_CATEGORY_LABEL.military },
  { id: "sanctions", label: EVENT_CATEGORY_LABEL.sanctions },
  { id: "trade", label: EVENT_CATEGORY_LABEL.trade },
  { id: "monetary", label: EVENT_CATEGORY_LABEL.monetary },
  { id: "energy", label: EVENT_CATEGORY_LABEL.energy },
];

export function InvestmentGlobeSection() {
  const [filter, setFilter] = useState<"all" | EventCategory>("all");
  const [selected, setSelected] = useState<Hotspot | null>(hotspots[0] ?? null);

  const topSignals = useMemo(() => signalFeed.slice(0, 3), []);

  return (
    <section
      id="globe"
      className="border-b border-white/5 bg-slate-950"
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            A global view that is built for your decisions
          </h2>
          <p className="mt-2 text-slate-400">
            Dots are regional stress lenses (demo data for positioning). Curves
            are illustrative flows of policy, parts, and commodities. Pick a
            thread to see what to watch in markets—not headlines for their own
            sake.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                (filter === f.id
                  ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100"
                  : "border-white/10 bg-white/0 text-slate-400 hover:border-white/20 hover:text-slate-200")
              )}
            >
              {f.id !== "all" && f.id in categoryHex && (
                <span
                  className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: categoryHex[f.id as EventCategory] }}
                />
              )}
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-8 rounded-2xl border border-white/10 bg-slate-900/30 p-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:p-4">
          <div className="overflow-hidden rounded-xl border border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
            <GlobeCanvas
              hotspots={hotspots}
              arcs={flowArcs}
              filter={filter}
              onSelectHotspot={setSelected}
              selectedId={selected?.id ?? null}
            />
          </div>
          <div className="flex flex-col gap-5 p-2 sm:p-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Selected node
              </p>
              {selected ? (
                <>
                  <h3 className="mt-1 text-lg font-semibold text-slate-50">
                    {selected.name}
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      {selected.region}
                    </span>
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    {selected.shortSummary}
                  </p>
                  <p className="mt-3 text-sm text-amber-100/90">
                    <span className="font-medium text-amber-200/80">
                      Portfolio angle:
                    </span>{" "}
                    {selected.investTakeaway}
                  </p>
                  <div className="mt-3 text-xs text-slate-500">
                    Local risk lens:{" "}
                    <span className="font-mono text-slate-300">
                      {selected.localRisk.toFixed(0)}/100
                    </span>{" "}
                    · {EVENT_CATEGORY_LABEL[selected.category]}
                  </div>
                </>
              ) : (
                <p className="mt-1 text-sm text-slate-400">
                  Click a point on the globe to see context and what to re-check
                  in your holdings.
                </p>
              )}
            </div>
            <div className="flex flex-1 flex-col rounded-xl border border-white/10 bg-slate-950/40">
              <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
                <Megaphone className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Signal stream (educational)
                </span>
                <span className="ml-auto text-[10px] text-slate-600">demo</span>
              </div>
              <ul className="max-h-[280px] divide-y divide-white/5 overflow-auto">
                {topSignals.map((s) => (
                  <li key={s.id} className="p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-slate-200">
                        {s.title}
                      </p>
                      <span className="font-mono text-[11px] text-slate-500">
                        {s.time}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {s.plainEnglish}
                    </p>
                    <p className="mt-1.5 text-xs text-cyan-200/80">
                      <span className="text-slate-500">Look for: </span>
                      {s.watchFor}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5" />
            In production, connect your feed here for continuous alignment with
            your research process.
          </span>
        </div>
      </div>
    </section>
  );
}
