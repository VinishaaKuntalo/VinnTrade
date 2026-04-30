"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealSignal } from "@/app/api/signal/[symbol]/route";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; data: RealSignal }
  | { status: "rate_limited"; retryAfter: number; countdown: number }
  | { status: "error"; message: string };

/** Abort the fetch if the API hasn't responded within this many ms */
const FETCH_TIMEOUT_MS = 8_000;

export type UseRealSignalOptions = {
  /**
   * Background refresh interval while last fetch succeeded.
   * `false` or `0` = fetch only when symbol / retry changes.
   * Default `NEXT_PUBLIC_SIGNAL_REFRESH_MS` or 90s.
   */
  pollMs?: number | false;
};

function resolvePollMs(explicit?: number | false): number | false {
  if (explicit === false) return false;
  if (typeof explicit === "number") return explicit > 0 ? explicit : false;
  const env = Number(process.env.NEXT_PUBLIC_SIGNAL_REFRESH_MS ?? "");
  if (env === 0) return false;
  if (Number.isFinite(env) && env > 0) return env;
  return 90_000;
}

export function useRealSignal(
  symbol: string | null,
  options?: UseRealSignalOptions
): State & { retry: () => void } {
  const pollMs = resolvePollMs(options?.pollMs);

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
    void seconds;
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
  }, [clearCountdown]);

  const retry = useCallback(() => {
    clearCountdown();
    setRetryTick((t) => t + 1);
  }, [clearCountdown]);

  /* Primary fetch — loading spinner, handles rate limits & errors */
  useEffect(() => {
    if (!symbol) {
      setState({ status: "idle" });
      return;
    }
    const key = symbol.toUpperCase();

    setState({ status: "loading" });
    clearCountdown();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    fetch(`/api/signal/${encodeURIComponent(key)}`, { signal: controller.signal })
      .then(async (r) => {
        clearTimeout(timeoutId);
        const json = (await r.json()) as RealSignal & {
          error?: string;
          retryAfterSeconds?: number;
        };
        if (controller.signal.aborted) return;

        if (r.status === 503) {
          const seconds = json.retryAfterSeconds ?? 60;
          setState({ status: "rate_limited", retryAfter: seconds, countdown: seconds });
          startCountdown(seconds);
        } else if (json.error) {
          setState({ status: "error", message: json.error });
        } else {
          setState({ status: "ok", data: json as RealSignal });
        }
      })
      .catch((e: unknown) => {
        clearTimeout(timeoutId);
        if (controller.signal.aborted) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, retryTick]);

  /* Silent polling while healthy — keeps overlay near live without flashing skeleton */
  useEffect(() => {
    if (!symbol || pollMs === false || pollMs <= 0) return;
    if (state.status !== "ok") return;

    const key = symbol.toUpperCase();
    let disposed = false;
    let abortCtrl: AbortController | null = null;

    const silentFetch = () => {
      abortCtrl?.abort();
      abortCtrl = new AbortController();
      const c = abortCtrl;
      const timeoutId = setTimeout(() => c.abort(), FETCH_TIMEOUT_MS);

      fetch(`/api/signal/${encodeURIComponent(key)}`, { signal: c.signal })
        .then(async (r) => {
          clearTimeout(timeoutId);
          const json = (await r.json()) as RealSignal & { error?: string };
          if (disposed || c.signal.aborted) return;
          if (!r.ok || json.error) return;
          setState({ status: "ok", data: json as RealSignal });
        })
        .catch(() => {
          clearTimeout(timeoutId);
        });
    };

    const id = setInterval(silentFetch, pollMs);
    return () => {
      disposed = true;
      clearInterval(id);
      abortCtrl?.abort();
    };
  }, [symbol, pollMs, state.status]);

  return { ...state, retry };
}
