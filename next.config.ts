import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: { root: appDir },
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
