"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Network, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Atlas", match: (pathname: string) => pathname === "/" },
  { href: "/regions/canada", label: "Regions", match: (pathname: string) => pathname.startsWith("/regions") },
  { href: "/organizations", label: "Organizations", match: (pathname: string) => pathname.startsWith("/organizations") },
  { href: "/demand", label: "Demand", match: (pathname: string) => pathname.startsWith("/demand") }
];

export function PublicAtlasHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="atlas-header">
      <div className="atlas-frame flex h-[62px] items-center justify-between gap-5">
        <Link href="/" className="flex min-w-0 items-center gap-3 no-underline" aria-label="Ecosystem Intelligence Public Atlas home">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0756d9] text-white shadow-[0_8px_20px_rgba(7,86,217,0.22)]">
            <Network className="size-[18px]" aria-hidden="true" />
          </span>
          <span className="min-w-0 truncate text-[15px] font-bold tracking-[-0.01em] text-[#101828] sm:text-[17px]">
            Ecosystem Intelligence
            <span className="mx-2 font-normal text-[#98a2b3]">/</span>
            <span className="font-normal text-[#667085]">Public Atlas</span>
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
                  "relative flex items-center px-1 text-[15px] font-medium text-[#344054] no-underline hover:text-[#0756d9] hover:no-underline",
                  active && "text-[#0756d9]"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
                {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#0756d9]" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="hidden h-9 items-center justify-center rounded-md border border-[#0756d9] px-4 text-sm font-semibold text-[#0756d9] no-underline hover:bg-[#eff6ff] hover:no-underline sm:inline-flex"
          >
            Sign in
          </Link>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-md border border-[#d0d5dd] bg-white text-[#344054] lg:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-[#e4e7ec] bg-white px-4 py-3 lg:hidden" aria-label="Mobile public atlas navigation">
          <div className="atlas-frame grid gap-1">
            {navigation.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium text-[#344054] no-underline hover:bg-[#f2f4f7] hover:no-underline",
                    active && "bg-[#eff6ff] text-[#0756d9]"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link href="/sign-in" className="mt-2 rounded-md bg-[#0756d9] px-3 py-2.5 text-center text-sm font-semibold text-white no-underline hover:no-underline">
              Sign in
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
