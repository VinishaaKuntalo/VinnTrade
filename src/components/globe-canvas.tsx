"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import type { EventCategory, FlowArc, Hotspot } from "@/types/vinntrade";
import { categoryHex, riskToPointRadius } from "@/lib/globe-theme";
import { cn } from "@/lib/cn";

const EARTH_URL =
  "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const BUMP_URL =
  "https://unpkg.com/three-globe/example/img/earth-topology.png";

type Filter = "all" | EventCategory;

export type GlobeCanvasProps = {
  hotspots: Hotspot[];
  arcs: FlowArc[];
  filter: Filter;
  className?: string;
  onSelectHotspot: (h: Hotspot) => void;
  selectedId: string | null;
};

function filterArcs(list: FlowArc[], f: Filter) {
  if (f === "all") return list;
  return list.filter((a) => a.category === f);
}

function filterPoints(list: Hotspot[], f: Filter) {
  if (f === "all") return list;
  return list.filter((p) => p.category === f);
}

export function GlobeCanvas({
  hotspots,
  arcs,
  filter,
  className,
  onSelectHotspot,
  selectedId,
}: GlobeCanvasProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dim, setDim] = useState({ w: 640, h: 520 });

  const points = useMemo(
    () => filterPoints(hotspots, filter),
    [hotspots, filter]
  );
  const arcList = useMemo(
    () => filterArcs(arcs, filter),
    [arcs, filter]
  );

  const handleResize = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setDim({ w: Math.max(240, width), h: Math.max(280, height) });
  }, []);

  useEffect(() => {
    handleResize();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => handleResize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [handleResize]);

  const onGlobeReady = useCallback(() => {
    const inst = globeRef.current;
    const controls = inst?.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.28;
      controls.enableDamping = true;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative h-[min(62vh,560px)] w-full min-h-[300px]", className)}
    >
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur">
        <span className="font-medium text-slate-100">Controls</span>
        <span className="text-slate-500"> · </span>
        drag to rotate · scroll to zoom
      </div>
      <Globe
        ref={globeRef}
        width={dim.w}
        height={dim.h}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={EARTH_URL}
        bumpImageUrl={BUMP_URL}
        showGlobe
        showAtmosphere
        atmosphereColor="#5eead4"
        atmosphereAltitude={0.18}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor={(d: object) => {
          const p = d as Hotspot;
          return categoryHex[p.category];
        }}
        pointRadius={(d: object) => {
          const p = d as Hotspot;
          const sel = p.id === selectedId ? 0.16 : 0;
          return riskToPointRadius(p.localRisk) + sel;
        }}
        pointLabel={(d: object) => {
          const p = d as Hotspot;
          return `<div style="padding:6px 8px;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:8px;font:12px/1.4 system-ui">
            <div style="font-weight:600">${p.name}</div>
            <div style="opacity:.85">${p.region} · local lens ${p.localRisk.toFixed(0)}/100</div>
          </div>`;
        }}
        onPointClick={(d: object) => onSelectHotspot(d as Hotspot)}
        onPointHover={(a, b) => {
          if (a || b) {
            const c = globeRef.current?.controls();
            if (c) c.autoRotate = !a;
          }
        }}
        pointAltitude={0.03}
        pointsTransitionDuration={400}
        arcsData={arcList}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={(d: object) => {
          const a = d as FlowArc;
          return [categoryHex[a.category] + "55", categoryHex[a.category]];
        }}
        arcAltitude={0.25}
        arcStroke={0.6}
        arcDashLength={0.35}
        arcDashGap={0.18}
        arcDashAnimateTime={4000}
        arcLabel="label"
        onGlobeReady={onGlobeReady}
        pointResolution={18}
        polygonStrokeColor={false}
        enablePointerInteraction
      />
      {selectedId && (
        <div className="pointer-events-none absolute bottom-2 right-2 z-10 max-w-[200px] rounded border border-cyan-500/30 bg-slate-950/80 px-2 py-1 text-[10px] text-cyan-100/90 backdrop-blur">
          Node highlighted — read the panel for why it may matter to portfolios.
        </div>
      )}
    </div>
  );
}
