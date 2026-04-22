import Link from "next/link";
import { Activity } from "lucide-react";
import { cn } from "@/lib/cn";

const nav = [
  { href: "#pulse", label: "Market Clarity" },
  { href: "#globe", label: "Global view" },
  { href: "#how", label: "How it helps" },
  { href: "#learn", label: "For investors" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-amber-400/20 ring-1 ring-cyan-500/30">
            <Activity className="h-4 w-4 text-cyan-300" aria-hidden />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-slate-50 group-hover:text-white">
              VinnTrade
            </span>
            <span className="text-[11px] text-slate-500">
              Geopolitics, translated for investors
            </span>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 text-sm text-slate-300 md:flex">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-md px-3 py-1.5 transition",
                "hover:bg-white/5 hover:text-white"
              )}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <a
          href="#access"
          className="shrink-0 rounded-full bg-gradient-to-r from-amber-400/90 to-amber-500/90 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-300 hover:to-amber-400"
        >
          Get early access
        </a>
      </div>
    </header>
  );
}
