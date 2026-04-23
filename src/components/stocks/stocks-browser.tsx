"use client";

import { useMemo, useState, useCallback } from "react";
import constituentsList from "@/data/sp500-constituents.json";
import { buildRiskProfile } from "@/lib/risk-engine";
import type { StockRiskProfile } from "@/types/stocks";
import type { StockConstituent } from "@/types/stocks";
import { RISK_BAND_LABEL, RISK_BAND_COLOR } from "@/types/stocks";
import { RiskDetailPanel } from "./risk-detail-panel";
import { RiskBadge } from "./risk-badge";
import { RiskScoreBar } from "./risk-score-bar";
import { cn } from "@/lib/cn";
import { Search, SlidersHorizontal, X, ChevronUp, ChevronDown } from "lucide-react";

const constituents = constituentsList as StockConstituent[];

/* ── pre-build all 503 profiles once ─ */
const ALL_PROFILES: StockRiskProfile[] = constituents.map(buildRiskProfile);

const ALL_SECTORS = Array.from(new Set(ALL_PROFILES.map((p) => p.sector))).sort();
const ALL_BANDS = ["low", "moderate", "elevated", "high", "critical"] as const;

type SortKey = "symbol" | "name" | "sector" | "overallScore";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 30;

export function StocksBrowser() {
  const [query, setQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [bandFilter, setBandFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("overallScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StockRiskProfile | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "overallScore" ? "desc" : "asc");
      }
      setPage(1);
    },
    [sortKey]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return ALL_PROFILES.filter((p) => {
      if (q && !p.symbol.toLowerCase().includes(q) && !p.name.toLowerCase().includes(q) && !p.subIndustry.toLowerCase().includes(q)) return false;
      if (sectorFilter !== "all" && p.sector !== sectorFilter) return false;
      if (bandFilter !== "all" && p.band !== bandFilter) return false;
      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortKey === "overallScore") cmp = a.overallScore - b.overallScore;
      else if (sortKey === "symbol") cmp = a.symbol.localeCompare(b.symbol);
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "sector") cmp = a.sector.localeCompare(b.sector);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, sectorFilter, bandFilter, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="h-3 w-3 opacity-20" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-cyan-400" />
      : <ChevronDown className="h-3 w-3 text-cyan-400" />;
  };

  const stats = useMemo(() => {
    const counts: Record<string, number> = { low: 0, moderate: 0, elevated: 0, high: 0, critical: 0 };
    ALL_PROFILES.forEach((p) => counts[p.band]++);
    return counts;
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* summary strip */}
      <div className="mb-6 flex flex-wrap gap-3">
        {ALL_BANDS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => { setBandFilter(bandFilter === b ? "all" : b); setPage(1); }}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              bandFilter === b
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
            )}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: RISK_BAND_COLOR[b] }}
            />
            {RISK_BAND_LABEL[b]}
            <span className="ml-0.5 font-mono opacity-60">{stats[b]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* ── table column ── */}
        <div className="flex-1 min-w-0">
          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search symbol, company, or sub-industry…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-white/10 bg-slate-900 pl-9 pr-9 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
              {query && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                showFilters
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                  : "border-white/10 bg-slate-900 text-slate-300 hover:border-white/20 hover:text-white"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {(sectorFilter !== "all" || bandFilter !== "all") && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              )}
            </button>
            <p className="text-xs text-slate-500">
              {filtered.length} of {ALL_PROFILES.length} stocks
            </p>
          </div>

          {/* filter drawer */}
          {showFilters && (
            <div className="mb-4 flex flex-wrap gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex flex-col gap-1.5 min-w-[180px]">
                <label className="text-xs font-medium text-slate-400">Sector</label>
                <select
                  value={sectorFilter}
                  onChange={(e) => { setSectorFilter(e.target.value); setPage(1); }}
                  className="rounded-lg border border-white/10 bg-slate-950 py-1.5 px-2 text-sm text-white focus:outline-none"
                >
                  <option value="all">All sectors</option>
                  {ALL_SECTORS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                <label className="text-xs font-medium text-slate-400">Risk band</label>
                <select
                  value={bandFilter}
                  onChange={(e) => { setBandFilter(e.target.value); setPage(1); }}
                  className="rounded-lg border border-white/10 bg-slate-950 py-1.5 px-2 text-sm text-white focus:outline-none"
                >
                  <option value="all">All bands</option>
                  {ALL_BANDS.map((b) => (
                    <option key={b} value={b}>{RISK_BAND_LABEL[b]}</option>
                  ))}
                </select>
              </div>
              {(sectorFilter !== "all" || bandFilter !== "all") && (
                <button
                  onClick={() => { setSectorFilter("all"); setBandFilter("all"); setPage(1); }}
                  className="self-end text-xs text-rose-400 hover:text-rose-300 transition"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* table */}
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/80">
                    {(
                      [
                        { key: "symbol" as SortKey, label: "Ticker", w: "w-20" },
                        { key: "name" as SortKey, label: "Company", w: "min-w-[160px]" },
                        { key: "sector" as SortKey, label: "Sector", w: "min-w-[140px]" },
                        { key: "overallScore" as SortKey, label: "Risk score", w: "w-36" },
                      ]
                    ).map(({ key, label, w }) => (
                      <th
                        key={key}
                        className={cn(
                          "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-200 transition",
                          w
                        )}
                        onClick={() => handleSort(key)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {label}
                          <SortIcon col={key} />
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 w-24">Band</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                        No stocks match your filters.
                      </td>
                    </tr>
                  ) : (
                    visible.map((p) => (
                      <tr
                        key={p.symbol}
                        className={cn(
                          "border-b border-white/5 cursor-pointer transition",
                          selected?.symbol === p.symbol
                            ? "bg-cyan-500/10"
                            : "hover:bg-white/5"
                        )}
                        onClick={() => setSelected(selected?.symbol === p.symbol ? null : p)}
                      >
                        <td className="px-4 py-3 font-mono font-semibold text-white text-sm">
                          {p.symbol}
                        </td>
                        <td className="px-4 py-3 text-slate-200 max-w-[220px] truncate">{p.name}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{p.sector}</td>
                        <td className="px-4 py-3 w-36">
                          <div className="flex items-center gap-2">
                            <RiskScoreBar score={p.overallScore} band={p.band} size="sm" />
                            <span className="font-mono text-xs tabular-nums text-slate-300 w-7 shrink-0">
                              {p.overallScore}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <RiskBadge band={p.band} size="xs" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* pagination */}
          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between gap-4 text-sm">
              <p className="text-slate-500 text-xs">
                Page {page} of {pageCount}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-white/20 hover:text-white disabled:opacity-30 transition"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                  const pg = Math.max(1, Math.min(pageCount - 4, page - 2)) + i;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs transition min-w-[36px]",
                        pg === page
                          ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-200"
                          : "border-white/10 bg-slate-900 text-slate-400 hover:text-white"
                      )}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-white/20 hover:text-white disabled:opacity-30 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── detail panel ── */}
        {selected && (
          <div className="w-full lg:w-[360px] shrink-0 sticky top-20 max-h-[calc(100vh-96px)]">
            <RiskDetailPanel
              profile={selected}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
