import { SiteHeader } from "@/components/site-header";
import { SignalsBrowserLoader } from "@/components/signals/signals-browser-loader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Signals — VinnTrade",
  description:
    "BUY / SELL / HOLD signals for all S&P 500 stocks, with confidence scores, trade setup, and geopolitical triggering events.",
};

export default function SignalsPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col overflow-hidden">
      <SiteHeader />
      <SignalsBrowserLoader />
    </div>
  );
}
