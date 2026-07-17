"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Waves, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { openPilotUpdates } from "@/lib/pilot/client";

const navigation = [
  { href: "/", label: "Atlas", match: (pathname: string) => pathname === "/" },
  { href: "/regions/canada", label: "Regions", match: (pathname: string) => pathname.startsWith("/regions") },
  { href: "/organizations", label: "Organizations", match: (pathname: string) => pathname.startsWith("/organizations") },
  { href: "/about", label: "About", match: (pathname: string) => pathname.startsWith("/about") || pathname.startsWith("/methodology") }
];

export function PublicAtlasHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="atlas-header">
      <div className="atlas-frame flex h-[68px] items-center justify-between gap-5">
        <Link href="/" className="flex min-w-0 items-center gap-3 no-underline" aria-label="Ecosystem Intelligence Public Atlas home">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#62d9e8]/50 bg-[#101047] text-[#62d9e8] shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
            <Waves className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[14px] font-bold tracking-[-0.01em] text-white sm:text-[17px]">Ecosystem Intelligence</span>
            <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.16em] text-[#62d9e8] sm:text-[10px]">Canadian Public Beta</span>
          </span>
        </Link>

        <nav className="hidden h-full items-stretch gap-8 lg:flex" aria-label="Public atlas navigation">
          {navigation.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center px-1 text-[15px] font-medium text-white/78 no-underline hover:text-white hover:no-underline",
                  active && "text-white"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
                {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#62d9e8]" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openPilotUpdates}
            className="hidden h-9 items-center gap-2 rounded-md bg-[#62d9e8] px-4 text-sm font-semibold text-[#05052b] hover:bg-[#8fe7f1] sm:inline-flex"
          >
            <Bell className="size-4" />
            Get updates
          </button>
          <Link
            href="/sign-in"
            className="hidden h-9 items-center justify-center rounded-md border border-white/30 px-4 text-sm font-semibold text-white no-underline hover:border-white/60 hover:bg-white/10 hover:no-underline sm:inline-flex"
          >
            Sign in
          </Link>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-md border border-white/25 bg-white/10 text-white lg:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-white/12 bg-[#05052b] px-4 py-3 lg:hidden" aria-label="Mobile public atlas navigation">
          <div className="atlas-frame grid gap-1">
            {navigation.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium text-white/78 no-underline hover:bg-white/10 hover:text-white hover:no-underline",
                    active && "bg-white/10 text-[#62d9e8]"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <button type="button" onClick={() => { openPilotUpdates(); setOpen(false); }} className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-[#62d9e8] px-3 py-2.5 text-center text-sm font-semibold text-[#05052b]"><Bell className="size-4" />Get updates</button>
            <Link href="/sign-in" className="rounded-md border border-white/25 px-3 py-2.5 text-center text-sm font-semibold text-white no-underline hover:bg-white/10 hover:no-underline">
              Sign in
            </Link>
          </div>
        </nav>
      ) : null}
      <div className="border-t border-white/10 bg-[#101047]">
        <div className="atlas-frame flex min-h-8 items-center justify-between gap-3 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-white/72 sm:text-[10px]">
          <span>Independent, evidence-backed Canadian ecosystem atlas</span>
          <span className="hidden text-[#62d9e8] sm:inline">Public sources · transparent gaps · human review</span>
        </div>
      </div>
    </header>
  );
}
