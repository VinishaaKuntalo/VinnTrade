import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 pb-10 pt-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-100">VinnTrade</p>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} · A clarity-first view of a complex
              world
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <a href="/#pulse" className="hover:text-slate-200">MCI</a>
            <a href="/#globe" className="hover:text-slate-200">Map</a>
            <Link href="/signals" className="hover:text-slate-200">Signals</Link>
            <Link href="/stocks" className="hover:text-slate-200">Risk browser</Link>
            <a href="/#how" className="hover:text-slate-200">How we help</a>
            <Link href="/" className="hover:text-slate-200">Home</Link>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-[11px] leading-relaxed text-slate-600">
          <strong className="text-slate-500">Disclaimer.</strong> VinnTrade
          provides general information for education and is not a registered
          investment adviser, broker-dealer, or tax advisor. You alone are
          responsible for your investment decisions, including suitability of
          any strategy, fund, or product. All figures and “live” style elements
          in this build are for demonstration. Past and simulated events are not
          reliable indicators of future results.
        </p>
      </div>
    </footer>
  );
}
