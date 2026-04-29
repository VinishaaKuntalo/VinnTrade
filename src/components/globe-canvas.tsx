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
  const isDragging = useRef(false);

  const points = useMemo(
    () => filterPoints(hotspots, filter),
    [hotspots, filter]
  );
  const arcList = useMemo(
    () => filterArcs(arcs, filter),
    [arcs, filter]
  );

  /* ── resize observer ── */
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
    const ro = new ResizeObserver(handleResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [handleResize]);

  /* ── pause auto-rotate while the user drags ──
     autoRotate + continuous controls.update() means the auto-spin
     overrides drag motion each frame — the globe feels frozen.
     Solution: cut autoRotate on mousedown/touchstart, restore on release. */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const pause = () => {
      isDragging.current = true;
      const c = globeRef.current?.controls();
      if (c) c.autoRotate = false;
    };

    const resume = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const c = globeRef.current?.controls();
      if (c) c.autoRotate = true;
    };

    el.addEventListener("mousedown", pause);
    el.addEventListener("touchstart", pause, { passive: true });
    // Listen on document so mouseup outside the canvas still resumes
    document.addEventListener("mouseup", resume);
    document.addEventListener("touchend", resume);

    return () => {
      el.removeEventListener("mousedown", pause);
      el.removeEventListener("touchstart", pause);
      document.removeEventListener("mouseup", resume);
      document.removeEventListener("touchend", resume);
    };
  }, []);

  /* ── initial globe setup ── */
  const onGlobeReady = useCallback(() => {
    const inst = globeRef.current;
    const controls = inst?.controls();
    if (!controls) return;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 200;
    controls.maxDistance = 600;
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative h-[min(62vh,560px)] w-full min-h-[300px]", className)}
      style={{ cursor: "grab" }}
    >
      {/* hint */}
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
        /* ── points ── */
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor={(d: object) => categoryHex[(d as Hotspot).category]}
        pointRadius={(d: object) => {
          const p = d as Hotspot;
          return riskToPointRadius(p.localRisk) + (p.id === selectedId ? 0.16 : 0);
        }}
        pointLabel={(d: object) => {
          const p = d as Hotspot;
          return `<div style="padding:6px 10px;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:8px;font:12px/1.5 system-ui;max-width:200px">
            <div style="font-weight:600">${p.name}</div>
            <div style="opacity:.7;font-size:11px">${p.region} · Risk ${p.localRisk}/100</div>
          </div>`;
        }}
        onPointClick={(d: object) => onSelectHotspot(d as Hotspot)}
        /* Pause auto-rotate while hovering a point so the label is readable */
        onPointHover={(point) => {
          const c = globeRef.current?.controls();
          if (!c || isDragging.current) return;
          c.autoRotate = !point;
        }}
        pointAltitude={0.03}
        pointsTransitionDuration={400}
        pointResolution={18}
        /* ── arcs ── */
        arcsData={arcList}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={(d: object) => {
          const a = d as FlowArc;
          return [`${categoryHex[a.category]}44`, categoryHex[a.category]];
        }}
        arcAltitude={0.22}
        arcStroke={0.5}
        arcDashLength={0.3}
        arcDashGap={0.15}
        arcDashAnimateTime={3500}
        arcLabel="label"
        /* ── setup ── */
        onGlobeReady={onGlobeReady}
        enablePointerInteraction
      />
    </div>
  );
}
