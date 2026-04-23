"use client";

import { useEffect, useState } from "react";
import type { RealSignal } from "@/app/api/signal/[symbol]/route";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; data: RealSignal }
  | { status: "rate_limited"; retryAfter: number }
  | { status: "error"; message: string };

const clientCache = new Map<string, { data: RealSignal; ts: number }>();
const CACHE_TTL = 4 * 60 * 60 * 1000;

export function useRealSignal(symbol: string | null) {
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    if (!symbol) { setState({ status: "idle" }); return; }
    const key = symbol.toUpperCase();

    const cached = clientCache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setState({ status: "ok", data: cached.data });
      return;
    }

    setState({ status: "loading" });
    let cancelled = false;

    fetch(`/api/signal/${key}`)
      .then(async (r) => {
        const json = await r.json();
        if (cancelled) return;
        if (r.status === 503) {
          setState({ status: "rate_limited", retryAfter: json.retryAfterSeconds ?? 60 });
        } else if (json.error) {
          setState({ status: "error", message: json.error });
        } else {
          clientCache.set(key, { data: json, ts: Date.now() });
          setState({ status: "ok", data: json });
        }
      })
      .catch((e) => {
        if (!cancelled) setState({ status: "error", message: String(e) });
      });

    return () => { cancelled = true; };
  }, [symbol]);

  return state;
}
