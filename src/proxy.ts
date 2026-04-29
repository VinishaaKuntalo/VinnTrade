import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();
const BUCKET_SWEEP_EVERY = 200;
let sweepCount = 0;

function getClientId(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function parseOrigins(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function rateLimitAllowed(
  key: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing) {
    buckets.set(key, { count: 1, windowStart: now });
  } else if (now - existing.windowStart >= windowMs) {
    existing.count = 1;
    existing.windowStart = now;
  } else if (existing.count >= max) {
    return false;
  } else {
    existing.count += 1;
  }

  if (++sweepCount % BUCKET_SWEEP_EVERY === 0) {
    for (const [k, v] of buckets) {
      if (now - v.windowStart > windowMs * 2) buckets.delete(k);
    }
  }
  return true;
}

function applyCors(
  res: NextResponse,
  allowlist: string[],
  origin: string | null
) {
  if (allowlist.length > 0 && origin && allowlist.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
  }
  return res;
}

function corsForPreflight(allowlist: string[], origin: string | null) {
  if (allowlist.length > 0 && origin && allowlist.includes(origin)) {
    const res = new NextResponse(null, { status: 204 });
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    res.headers.set("Access-Control-Max-Age", "86400");
    return res;
  }
  return new NextResponse(null, { status: 204 });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const allowlist = parseOrigins(process.env.CORS_ALLOWED_ORIGINS);
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") {
    if (allowlist.length > 0) {
      return corsForPreflight(allowlist, origin);
    }
    return new NextResponse(null, { status: 204 });
  }

  const max = Math.max(1, Number(process.env.API_RATE_LIMIT_MAX || "120"));
  const windowMs = Math.max(
    1_000,
    Number(process.env.API_RATE_WINDOW_MS || "60000")
  );
  const client = getClientId(request);
  const key = `api:${client}`;

  if (!rateLimitAllowed(key, max, windowMs)) {
    logger.warn("api.rate_limited", { path: pathname, client });
    return new NextResponse(
      JSON.stringify({ error: "Too many requests", code: "RATE_LIMITED" }),
      {
        status: 429,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "Retry-After": String(Math.ceil(windowMs / 1000)),
        },
      }
    );
  }

  const res = NextResponse.next();
  return applyCors(res, allowlist, origin);
}

export const config = {
  matcher: ["/api/:path*"],
};
