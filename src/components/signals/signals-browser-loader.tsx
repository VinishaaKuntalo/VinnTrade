"use client";

import { SignalsBrowser } from "./signals-browser";

/**
 * Load the browser in the same chunk as this entry. A separate `dynamic()` here
 * forced an extra `_next` round-trip over high-latency LAN (e.g. 10.x dev URL)
 * before any UI could mount.
 */
export function SignalsBrowserLoader() {
  return <SignalsBrowser />;
}
