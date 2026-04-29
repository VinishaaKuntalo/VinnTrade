"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import constituentsList from "@/data/sp500-constituents.json";
import { EXTRA_ASSETS } from "@/data/extra-assets";
import { buildRiskProfile } from "@/lib/risk-engine";
import type { StockConstituent, StockRiskProfile } from "@/types/stocks";
import { RISK_BAND_COLOR, RISK_BAND_LABEL } from "@/types/stocks";
import { cn } from "@/lib/cn";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  DatabaseZap,
  Link2,
  ShieldCheck,
  Trash2,
  Upload,
  Wallet,
} from "lucide-react";

interface Holding {
  id: string;
  symbol: string;
  name?: string;
  quantity: number;
  avgCost?: number;
  broker?: string;
  account?: string;
  importedAt: string;
}

interface BrokerProviderStatus {
  id: "snaptrade" | "plaid" | "ibkr";
  name: string;
  configured: boolean;
  mode: "oauth" | "gateway" | "manual";
  description: string;
  requiredEnv: string[];
}

const STORAGE_KEY = "vinntrade:portfolio:holdings:v1";
const constituents = constituentsList as StockConstituent[];
const riskBySymbol = new Map<string, StockRiskProfile>(
  constituents.map((c) => [c.symbol, buildRiskProfile(c)])
);
const extraBySymbol = new Map(EXTRA_ASSETS.map((a) => [a.symbol, a]));

function parseNumber(value: string | undefined) {
  if (!value) return undefined;
  const n = Number(value.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function splitCsvLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out.map((v) => v.replace(/^"|"$/g, ""));
}

function parseHoldingsCsv(text: string): Holding[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ""));
  const idx = (...names: string[]) => headers.findIndex((h) => names.includes(h));
  const symbolIdx = idx("symbol", "ticker", "security", "holding");
  const qtyIdx = idx("quantity", "qty", "shares", "units");
  const costIdx = idx("avgcost", "averagecost", "costbasis", "cost", "price");
  const nameIdx = idx("name", "company", "description");
  const brokerIdx = idx("broker", "institution");
  const accountIdx = idx("account", "accountname", "accountid");

  if (symbolIdx < 0 || qtyIdx < 0) return [];

  return lines.slice(1).flatMap((line, row) => {
    const cells = splitCsvLine(line);
    const symbol = cells[symbolIdx]?.trim().toUpperCase();
    const quantity = parseNumber(cells[qtyIdx]);
    if (!symbol || !quantity || quantity <= 0) return [];
    return [{
      id: `${symbol}-${Date.now()}-${row}`,
      symbol,
      name: cells[nameIdx]?.trim() || riskBySymbol.get(symbol)?.name || extraBySymbol.get(symbol)?.name,
      quantity,
      avgCost: parseNumber(cells[costIdx]),
      broker: cells[brokerIdx]?.trim() || "CSV Import",
      account: cells[accountIdx]?.trim() || "Imported",
      importedAt: new Date().toISOString(),
    }];
  });
}

function sampleCsv() {
  return `symbol,quantity,avgCost,broker,account\nAAPL,12,185.20,Fidelity,Taxable\nGLD,8,204.50,Robinhood,IRA\nXOM,20,106.10,Schwab,Taxable`;
}

export function PortfolioWorkspace() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [providers, setProviders] = useState<BrokerProviderStatus[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [connectLoading, setConnectLoading] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setHoldings(JSON.parse(raw) as Holding[]);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    fetch("/api/broker/status")
      .then((r) => r.json())
      .then((d: { providers: BrokerProviderStatus[] }) => setProviders(d.providers ?? []))
      .catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  }, [holdings]);

  const summary = useMemo(() => {
    const marketValue = holdings.reduce((sum, h) => sum + (h.avgCost ?? 0) * h.quantity, 0);
    const withRisk = holdings.map((h) => ({ h, risk: riskBySymbol.get(h.symbol) }));
    const avgRisk = withRisk.filter((x) => x.risk).reduce((sum, x) => sum + (x.risk?.overallScore ?? 0), 0) / Math.max(1, withRisk.filter((x) => x.risk).length);
    return {
      positions: holdings.length,
      marketValue,
      avgRisk: Math.round(avgRisk),
      riskCovered: withRisk.filter((x) => x.risk).length,
    };
  }, [holdings]);

  async function handleFile(file: File) {
    const text = await file.text();
    const parsed = parseHoldingsCsv(text);
    if (!parsed.length) {
      setMessage("Could not import. CSV needs at least symbol and quantity columns.");
      return;
    }
    setHoldings((prev) => [...parsed, ...prev]);
    setMessage(`Imported ${parsed.length} holding${parsed.length === 1 ? "" : "s"}.`);
  }

  async function connect(provider: BrokerProviderStatus) {
    setConnectLoading(provider.id);
    setMessage(null);
    const res = await fetch("/api/broker/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: provider.id }),
    });
    const data = await res.json();
    setConnectLoading(null);
    if (!res.ok) {
      setMessage(`${provider.name}: ${data.error} Missing: ${(data.missing ?? []).join(", ") || "implementation"}.`);
      return;
    }
    setMessage(`${provider.name}: ${data.nextStep}`);
  }

  function importSample() {
    const parsed = parseHoldingsCsv(sampleCsv());
    setHoldings((prev) => [...parsed, ...prev]);
    setMessage("Loaded sample holdings.");
  }

  function clearAll() {
    setHoldings([]);
    setMessage("Portfolio cleared from this browser.");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Positions</p>
          <p className="mt-1 text-3xl font-bold text-white">{summary.positions}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Cost basis</p>
          <p className="mt-1 text-3xl font-bold text-white">
            ${summary.marketValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div
          className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
          title="Average of model scores for holdings we recognize. Bands: Low below 30; Moderate 30–44; Elevated 45–59; High 60–74; Critical 75+."
        >
          <p className="text-xs uppercase tracking-wider text-slate-500">Avg risk</p>
          <p className="mt-1 text-3xl font-bold text-amber-300">{summary.avgRisk}<span className="text-base text-slate-500">/100</span></p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Risk coverage</p>
          <p className="mt-1 text-3xl font-bold text-cyan-300">{summary.riskCovered}<span className="text-base text-slate-500">/{summary.positions}</span></p>
        </div>
      </div>

      {message && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Upload className="h-4 w-4 text-cyan-300" />
              <h2 className="font-semibold text-white">Import holdings</h2>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-slate-400">
              Upload a CSV with columns like <span className="font-mono text-slate-200">symbol, quantity, avgCost, broker, account</span>.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.currentTarget.value = "";
              }}
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Upload CSV
              </button>
              <button
                type="button"
                onClick={importSample}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Load sample portfolio
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-amber-300" />
              <h2 className="font-semibold text-white">Broker connect</h2>
            </div>
            <div className="space-y-3">
              {providers.map((p) => (
                <div key={p.id} className="rounded-xl border border-white/8 bg-slate-950/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{p.description}</p>
                    </div>
                    {p.configured ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void connect(p)}
                    disabled={connectLoading === p.id}
                    className={cn(
                      "mt-3 w-full rounded-lg border px-3 py-2 text-xs font-semibold transition",
                      p.configured
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                        : "border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {connectLoading === p.id ? "Checking..." : p.configured ? "Start connection" : "Setup required"}
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-3 flex gap-2 text-[11px] leading-relaxed text-slate-600">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Broker passwords should never be stored here. Direct links require tokenized OAuth/gateway access.
            </p>
          </section>
        </aside>

        <section className="rounded-2xl border border-white/10 bg-slate-900/70">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-cyan-300" />
              <h2 className="font-semibold text-white">Portfolio holdings</h2>
            </div>
            {holdings.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {holdings.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 p-8 text-center">
              <DatabaseZap className="h-9 w-9 text-slate-700" />
              <p className="font-medium text-slate-300">No holdings imported yet</p>
              <p className="max-w-sm text-sm text-slate-500">
                Upload a broker CSV or configure a broker connector to sync holdings.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/60 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Symbol</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Avg cost</th>
                    <th className="px-4 py-3">Broker</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const risk = riskBySymbol.get(h.symbol);
                    return (
                      <tr key={h.id} className="border-b border-white/5 hover:bg-white/4">
                        <td className="px-4 py-3 font-mono font-bold text-white">{h.symbol}</td>
                        <td className="max-w-[240px] truncate px-4 py-3 text-slate-300">{h.name ?? "Unknown"}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-300">{h.quantity}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-300">
                          {h.avgCost ? `$${h.avgCost.toFixed(2)}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {h.broker}
                          <span className="block text-[10px] text-slate-600">{h.account}</span>
                        </td>
                        <td className="px-4 py-3">
                          {risk ? (
                            <span
                              className="rounded border px-2 py-1 text-xs font-semibold"
                              style={{
                                borderColor: `${RISK_BAND_COLOR[risk.band]}55`,
                                color: RISK_BAND_COLOR[risk.band],
                                background: `${RISK_BAND_COLOR[risk.band]}14`,
                              }}
                            >
                              {RISK_BAND_LABEL[risk.band]} · {risk.overallScore}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">No S&P risk model</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/charts/${encodeURIComponent(h.symbol)}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                            Chart
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
