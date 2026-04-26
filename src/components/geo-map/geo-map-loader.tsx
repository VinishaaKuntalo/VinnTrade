"use client";

import dynamic from "next/dynamic";

const GeoMapView = dynamic(
  () =>
    import("@/components/geo-map/geo-map-view").then((m) => ({
      default: m.GeoMapView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
          <p className="text-sm text-slate-400">Loading market impact map…</p>
        </div>
      </div>
    ),
  }
);

export function GeoMapLoader() {
  return <GeoMapView />;
}
