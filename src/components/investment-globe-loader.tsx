"use client";

import { InvestmentGlobeSection } from "@/components/investment-globe-section";

/**
 * The 3D globe is loaded inside `InvestmentGlobeSection` via `next/dynamic`
 * with `ssr: false` on `GlobeCanvas` only (not the whole section). That keeps
 * Three/WebGL off the server while avoiding a single huge lazy chunk for the
 * entire globe block— which could leave the UI stuck on “Loading 3D map…”
 * over a LAN dev URL or slow networks.
 */
export function InvestmentGlobeLoader() {
  return <InvestmentGlobeSection />;
}
