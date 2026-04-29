"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/#pulse", label: "Market Clarity" },
  { href: "/#globe", label: "Global view" },
  { href: "/geo-map", label: "Geo Map" },
  { href: "/signals", label: "Signals" },
  { href: "/stocks", label: "Risk browser" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/#how", label: "How it helps" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/";
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-amber-400/20 ring-1 ring-cyan-500/30">
            <Activity className="h-4 w-4 text-cyan-300" aria-hidden />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-slate-50 group-hover:text-white">
              VinnTrade
            </span>
            <span className="hidden text-[11px] text-slate-500 sm:block">
              Geopolitics, translated for investors
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm text-slate-300 md:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-md px-3 py-1.5 transition",
                isActive(n.href)
                  ? "bg-white/8 text-white"
                  : "hover:bg-white/5 hover:text-white",
                n.href === "/signals" && !isActive(n.href) && "text-amber-200/80 hover:text-amber-100",
                n.href === "/signals" && isActive(n.href) && "bg-amber-500/10 text-amber-100",
                n.href === "/geo-map" && !isActive(n.href) && "text-cyan-300/80 hover:text-cyan-200",
                n.href === "/geo-map" && isActive(n.href) && "bg-cyan-500/10 text-cyan-200"
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/#access"
            className="shrink-0 rounded-full bg-gradient-to-r from-amber-400/90 to-amber-500/90 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-300 hover:to-amber-400"
          >
            <span className="hidden sm:inline">Get early access</span>
            <span className="sm:hidden">Early access</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <div className="border-t border-white/8 bg-slate-950/95 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-0.5 p-3">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm transition",
                  isActive(n.href)
                    ? "bg-white/8 text-white font-medium"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                  n.href === "/signals" && !isActive(n.href) && "text-amber-200/80",
                  n.href === "/signals" && isActive(n.href) && "bg-amber-500/10 text-amber-100",
                  n.href === "/geo-map" && !isActive(n.href) && "text-cyan-300/80",
                  n.href === "/geo-map" && isActive(n.href) && "bg-cyan-500/10 text-cyan-200"
                )}
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-white/8 pt-2">
              <Link
                href="/#access"
                onClick={() => setMobileOpen(false)}
                className="block rounded-full bg-gradient-to-r from-amber-400/90 to-amber-500/90 px-4 py-2.5 text-center text-sm font-medium text-slate-950"
              >
                Get early access
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
