/**
 * Canonical public URL for metadata, sitemap, and OG tags.
 * Set NEXT_PUBLIC_SITE_URL in production; Vercel provides VERCEL_URL as fallback.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  return "http://localhost:3000";
}
