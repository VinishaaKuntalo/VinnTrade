"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { flowArcs, hotspots, signalFeed } from "@/data/hotspots";
import type { EventCategory, Hotspot } from "@/types/vinntrade";
import { EVENT_CATEGORY_LABEL } from "@/types/vinntrade";
import { GlobeCanvas } from "@/components/globe-canvas";
import { categoryHex } from "@/lib/globe-theme";
import { ArrowRight, Radio } from "lucide-react";
import { cn } from "@/lib/cn";

const LEVEL_STYLE = {
  elevated: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  notable:  "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  watch:    "bg-slate-700/60 text-slate-400 border border-white/10",
};

const filters: { id: "all" | EventCategory; label: string }[] = [
  { id: "all",      label: "All drivers" },
  { id: "military", label: EVENT_CATEGORY_LABEL.military },
  { id: "sanctions",label: EVENT_CATEGORY_LABEL.sanctions },
  { id: "trade",    label: EVENT_CATEGORY_LABEL.trade },
  { id: "monetary", label: EVENT_CATEGORY_LABEL.monetary },
  { id: "energy",   label: EVENT_CATEGORY_LABEL.energy },
];

function RiskBar({ value }: { value: number }) {
  const color =
    value >= 70 ? "bg-rose-500"
    : value >= 55 ? "bg-amber-400"
    : "bg-emerald-500";
  const label =
    value >= 70 ? "HIGH" : value >= 55 ? "ELEVATED" : "MODERATE";
  const labelColor =
    value >= 70 ? "text-rose-400" : value >= 55 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={cn("h-1.5 rounded-full transition-all", color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn("shrink-0 text-[10px] font-bold tracking-wider w-16 text-right", labelColor)}>
        {value}/100 · {label}
      </span>
    </div>
  );
}

function HotspotPanel({ hotspot }: { hotspot: Hotspot }) {
  const catColor = categoryHex[hotspot.category];

  return (
    <div className="flex h-full flex-col gap-3">
      {/* header */}
      <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: catColor }}
              />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {EVENT_CATEGORY_LABEL[hotspot.category]}
              </span>
              <span className="text-[10px] text-slate-600">·</span>
              <span className="text-[10px] text-slate-500">{hotspot.region}</span>
            </div>
            <h3 className="mt-1.5 text-base font-semibold text-slate-50">
              {hotspot.name}
            </h3>
          </div>
        </div>

        {/* risk bar */}
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Regional stress lens
          </p>
          <RiskBar value={hotspot.localRisk} />
        </div>
      </div>

      {/* summary + takeaway */}
      <div className="rounded-xl border border-white/8 bg-slate-950/40 p-4 space-y-3">
        <p className="text-sm leading-relaxed text-slate-300">
          {hotspot.shortSummary}
        </p>
        <div className="border-t border-white/6 pt-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400/70">
            Portfolio angle
          </p>
          <p className="text-sm leading-relaxed text-amber-100/80">
            {hotspot.investTakeaway}
          </p>
        </div>
      </div>

      {/* sectors exposed */}
      <div className="rounded-xl border border-white/8 bg-slate-950/40 p-4">
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Sectors most exposed
        </p>
        <div className="flex flex-wrap gap-1.5">
          {hotspot.sectors.map((s) => (
            <span
              key={s}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300"
            >
              {s}
            </span>
          ))}
        </div>
        {hotspot.watchTickers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-[10px] text-slate-600 mr-1 self-center">Watch:</span>
            {hotspot.watchTickers.map((t) => (
              <span
                key={t}
                className="rounded bg-slate-800/80 px-2 py-0.5 font-mono text-[10px] text-slate-400"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <Link
        href="/signals"
        className="flex items-center justify-between rounded-xl border border-cyan-500/25 bg-cyan-500/8 px-4 py-3 transition hover:border-cyan-500/40 hover:bg-cyan-500/12"
      >
        <div>
          <p className="text-xs font-semibold text-cyan-200">Browse affected signals</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            BUY / SELL / HOLD across exposed sectors
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-cyan-400" />
      </Link>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-slate-950/20 p-8 text-center">
      <div>
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-800/60">
          <Radio className="h-5 w-5 text-slate-500" />
        </div>
        <p className="text-sm font-medium text-slate-400">
          Click any node on the globe
        </p>
        <p className="mt-1 text-xs text-slate-600">
          See the investment angle for that region
        </p>
      </div>
    </div>
  );
}

export function InvestmentGlobeSection() {
  const [filter, setFilter] = useState<"all" | EventCategory>("all");
  const [selected, setSelected] = useState<Hotspot | null>(hotspots[0] ?? null);
  const feedItems = useMemo(() => signalFeed, []);

  const visibleCount = useMemo(() => {
    if (filter === "all") return hotspots.length;
    return hotspots.filter((h) => h.category === filter).length;
  }, [filter]);

  function applyFilter(id: "all" | EventCategory) {
    setFilter(id);
    if (id === "all") return;
    setSelected((prev) => {
      if (prev?.category === id) return prev;
      const first = hotspots.find((h) => h.category === id);
      return first ?? null;
    });
  }

  return (
    <section id="globe" className="border-b border-white/5 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        {/* heading */}
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            A global view built for your decisions
          </h2>
          <p className="mt-2 text-slate-400">
            Each node is a live stress point. Each arc is a channel — rates,
            trade, energy, conflict — that can move prices before the headlines
            catch up. Click any node to see the investment angle.
          </p>
        </div>

        {/* filter pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => applyFilter(f.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                filter === f.id
                  ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100"
                  : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
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
        {filter !== "all" && (
          <p className="mt-2 text-xs text-slate-500">
            {visibleCount} stress point{visibleCount === 1 ? "" : "s"} on the globe for this driver
            {visibleCount === 0 ? " — try another filter or All drivers." : "."}
          </p>
        )}

        {/* main grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
          {/* globe */}
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-slate-900 to-slate-950">
            <GlobeCanvas
              hotspots={hotspots}
              arcs={flowArcs}
              filter={filter}
              onSelectHotspot={setSelected}
              selectedId={selected?.id ?? null}
            />
          </div>

          {/* right column: selected node + signal feed */}
          <div className="flex flex-col gap-4">
            {/* node detail */}
            <div className="min-h-0 flex-1">
              {selected ? (
                <HotspotPanel hotspot={selected} />
              ) : (
                <EmptyPanel />
              )}
            </div>
          </div>
        </div>

        {/* signal feed — full width below */}
        <div className="mt-6 rounded-2xl border border-white/8 bg-slate-900/40">
          <div className="flex items-center gap-2 border-b border-white/6 px-4 py-3">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Signal stream
            </span>
            <span className="ml-auto rounded border border-white/10 px-2 py-0.5 text-[10px] text-slate-600">
              educational · demo data
            </span>
            <Link
              href="/signals"
              className="ml-2 flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition"
            >
              Full browser <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid divide-y divide-white/5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
            {feedItems.map((s) => (
              <div key={s.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      LEVEL_STYLE[s.level]
                    )}
                  >
                    {s.level}
                  </span>
                  <span className="font-mono text-[10px] text-slate-600">{s.time}</span>
                </div>
                <p className="text-xs font-semibold text-slate-200 leading-snug">
                  {s.title}
                </p>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                  {s.plainEnglish}
                </p>
                <p className="mt-2 text-[10px] text-slate-600">
                  <span className="text-slate-500">Watch: </span>
                  {s.watchFor}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-600">
          <Radio className="h-3.5 w-3.5" />
          In production, connect your live event feed here for continuous
          alignment with your research process.
        </p>
      </div>
    </section>
  );
}
