"use client";

import { useEffect, useRef, useState } from "react";
import type { BatchQuoteResponse, QuoteResult } from "@/app/api/quotes/route";
import { instrumentCurrency } from "@/lib/instrument-currency";

export type QuoteState =
  | { status: "stale"; data: QuoteResult }   // showing static seed price while live loads
  | { status: "loading" }                    // no seed available yet
  | { status: "ok"; data: QuoteResult }      // confirmed live price
  | { status: "error"; fallback: true };

export type QuoteMap = Record<string, QuoteState>;

/* ── Client-side cache ── */
const clientCache = new Map<string, { data: QuoteResult; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000;

/**
 * Build a QuoteResult from static seed data so the UI is never blank.
 * Marked source "unavailable" so the card shows it without the LIVE badge.
 */
function seedResult(symbol: string, price: number, change: number): QuoteResult {
  return {
    symbol,
    price,
    prevClose: price,
    change,
    fetchedAt: "",
    source: "unavailable",
    currency: instrumentCurrency(symbol),
  };
}

/**
 * Fetch live prices for all symbols in a single batch request.
 * Immediately surfaces static seed prices while the live fetch is in flight.
 */
export function useCountryStocks(
  symbols: string[],
  seeds?: Record<string, { price: number; change: number }>
): QuoteMap {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const prevKeyRef = useRef<string>("");

  useEffect(() => {
    const upper = symbols.map((s) => s.toUpperCase());
    const key = upper.join(",");

    if (!upper.length) {
      setQuotes({});
      prevKeyRef.current = "";
      return;
    }

    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;

    // Seed the UI immediately — either cached live data or static fallback
    const initial: QuoteMap = {};
    const toFetch: string[] = [];

    for (const sym of upper) {
      const hit = clientCache.get(sym);
      if (hit && Date.now() - hit.ts < CACHE_TTL) {
        // Fresh cache — show as live straight away
        initial[sym] = { status: "ok", data: hit.data };
      } else {
        // Show static seed instantly; fetch live in background
        const seed = seeds?.[sym];
        initial[sym] = seed
          ? { status: "stale", data: seedResult(sym, seed.price, seed.change) }
          : { status: "loading" };
        toFetch.push(sym);
      }
    }

    setQuotes(initial);

    if (!toFetch.length) return;

    const controller = new AbortController();

    fetch(`/api/quotes?symbols=${toFetch.join(",")}`, { signal: controller.signal })
      .then((r) => r.json() as Promise<BatchQuoteResponse>)
      .then((batch) => {
        if (controller.signal.aborted) return;
        const now = Date.now();
        setQuotes((prev) => {
          const next = { ...prev };
          for (const sym of toFetch) {
            const q = batch[sym];
            if (q?.source === "live") {
              clientCache.set(sym, { data: q, ts: now });
              next[sym] = { status: "ok", data: q };
            } else {
              // Live failed — keep seed or mark error
              const prev_state = prev[sym];
              next[sym] =
                prev_state?.status === "stale"
                  ? { status: "error", fallback: true }   // seed shown, just drop the spinner
                  : { status: "error", fallback: true };
            }
          }
          return next;
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setQuotes((prev) => {
          const next = { ...prev };
          for (const sym of toFetch) {
            if (next[sym]?.status === "loading") {
              next[sym] = { status: "error", fallback: true };
            }
            // If stale seed was shown, leave it as-is (error fallback)
          }
          return next;
        });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(",")]);

  return quotes;
}
