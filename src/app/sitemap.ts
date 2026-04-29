import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const staticPaths = ["", "stocks", "signals", "geo-map", "portfolio"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();
  return staticPaths.map((segment, i) => ({
    url: segment ? `${base}/${segment}` : base,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: i === 0 ? 1 : 0.75,
  }));
}
