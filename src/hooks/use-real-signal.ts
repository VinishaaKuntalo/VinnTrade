"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealSignal } from "@/app/api/signal/[symbol]/route";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; data: RealSignal }
  | { status: "rate_limited"; retryAfter: number; countdown: number }
  | { status: "error"; message: string };

const clientCache = new Map<string, { data: RealSignal; ts: number }>();
const CACHE_TTL = 4 * 60 * 60 * 1000;
/** Abort the fetch if the API hasn't responded within this many ms */
const FETCH_TIMEOUT_MS = 12_000;

export function useRealSignal(symbol: string | null): State & { retry: () => void } {
  const [state, setState] = useState<State>({ status: "idle" });
  const [retryTick, setRetryTick] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startCountdown = useCallback((seconds: number) => {
    clearCountdown();
    countdownRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.status !== "rate_limited") {
          clearCountdown();
          return prev;
        }
        const next = prev.countdown - 1;
        if (next <= 0) {
          clearCountdown();
          setRetryTick((t) => t + 1);
          return { status: "loading" };
        }
        return { ...prev, countdown: next };
      });
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = useCallback(() => {
    clearCountdown();
    setRetryTick((t) => t + 1);
  }, [clearCountdown]);

  useEffect(() => {
    if (!symbol) { setState({ status: "idle" }); return; }
    const key = symbol.toUpperCase();

    const cached = clientCache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setState({ status: "ok", data: cached.data });
      return;
    }

    setState({ status: "loading" });
    clearCountdown();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    fetch(`/api/signal/${key}`, { signal: controller.signal })
      .then(async (r) => {
        clearTimeout(timeoutId);
        const json = await r.json();
        if (controller.signal.aborted) return;

        if (r.status === 503) {
          const seconds = json.retryAfterSeconds ?? 60;
          setState({ status: "rate_limited", retryAfter: seconds, countdown: seconds });
          startCountdown(seconds);
        } else if (json.error) {
          setState({ status: "error", message: json.error });
        } else {
          clientCache.set(key, { data: json, ts: Date.now() });
          setState({ status: "ok", data: json });
        }
      })
      .catch((e: unknown) => {
        clearTimeout(timeoutId);
        if (controller.signal.aborted) {
          // Timed out — treat like a rate limit so the user can retry
          const seconds = 30;
          setState({ status: "rate_limited", retryAfter: seconds, countdown: seconds });
          startCountdown(seconds);
        } else {
          setState({ status: "error", message: e instanceof Error ? e.message : String(e) });
        }
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
      clearCountdown();
    };
  // retryTick intentionally included so manual/auto retry re-runs the fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, retryTick]);

  return { ...state, retry };
}
