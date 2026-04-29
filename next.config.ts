import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const securityHeaders: { key: string; value: string }[] = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  turbopack: { root: appDir },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  transpilePackages: [
    "lightweight-charts",
    "fancy-canvas",
    "react-simple-maps",
    "d3-geo",
    "d3-zoom",
    "d3-selection",
    "d3-transition",
    "d3-interpolate",
    "d3-color",
    "d3-ease",
    "d3-timer",
    "d3-dispatch",
    "d3-array",
    "d3-path",
    "d3-shape",
  ],
};

export default nextConfig;
