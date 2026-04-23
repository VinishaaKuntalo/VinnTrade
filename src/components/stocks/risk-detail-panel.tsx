import type { StockRiskProfile } from "@/types/stocks";
import { RISK_BAND_COLOR, RISK_BAND_LABEL } from "@/types/stocks";
import { RiskScoreBar } from "./risk-score-bar";
import { RiskBadge } from "./risk-badge";
import { MapPin, TrendingUp, Info, X } from "lucide-react";

export function RiskDetailPanel({
  profile,
  onClose,
}: {
  profile: StockRiskProfile;
  onClose: () => void;
}) {
  const color = RISK_BAND_COLOR[profile.band];

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      {/* header */}
      <div
        className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/10"
        style={{ borderTopColor: color, borderTopWidth: 3 }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xl font-bold text-white">{profile.symbol}</span>
            <RiskBadge band={profile.band} />
          </div>
          <p className="mt-0.5 text-sm text-slate-300 truncate">{profile.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{profile.sector} · {profile.subIndustry}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* overall score */}
        <div className="rounded-xl bg-slate-950/60 border border-white/5 p-4">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Overall Risk Score
            </p>
            <span
              className="text-3xl font-bold tabular-nums"
              style={{ color }}
            >
              {profile.overallScore}
              <span className="text-base font-normal text-slate-500">/100</span>
            </span>
          </div>
          <RiskScoreBar score={profile.overallScore} band={profile.band} size="lg" />
          <p className="mt-2 text-xs text-slate-400">
            {RISK_BAND_LABEL[profile.band]} risk band — structured model, not a trading signal.
          </p>
        </div>

        {/* factor breakdown */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Factor breakdown
          </p>
          <div className="space-y-3">
            {profile.factors.map((f) => (
              <div key={f.label} className="rounded-lg border border-white/5 bg-slate-950/40 px-3 py-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-200">{f.label}</span>
                  <span className="text-xs tabular-nums text-slate-400 font-mono">{f.score}</span>
                </div>
                <RiskScoreBar score={f.score} band={profile.band} size="sm" />
                <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">{f.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* geo */}
        <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-3.5 w-3.5 text-cyan-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Geographic exposure
            </p>
          </div>
          <p className="text-xs text-slate-300">{profile.geoExposure}</p>
          <p className="text-[11px] text-slate-500 mt-1">{profile.hq}</p>
        </div>

        {/* investor angle */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-amber-300" />
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">
              Sector investor angle
            </p>
          </div>
          <p className="text-xs text-amber-100/80 leading-relaxed">{profile.investorAngle}</p>
        </div>

        {/* disclaimer */}
        <div className="rounded-lg border border-white/5 bg-slate-950/30 p-3 flex gap-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-600" />
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Scores are a deterministic model based on sector/sub-industry/HQ — for
            educational framing only. Not live data, not financial advice.
            Updated: {profile.updatedAt}.
          </p>
        </div>
      </div>
    </div>
  );
}
