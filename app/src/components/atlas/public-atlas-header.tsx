"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronUp, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { openBetaUpdates } from "@/lib/product-insights/client";

const navigation = [
  { href: "/", label: "Ecosystem Map", match: (pathname: string) => pathname === "/" },
  { href: "/regions/canada", label: "Regions", match: (pathname: string) => pathname.startsWith("/regions") },
  { href: "/organizations", label: "Organizations", match: (pathname: string) => pathname.startsWith("/organizations") },
  { href: "/about", label: "About", match: (pathname: string) => pathname.startsWith("/about") || pathname.startsWith("/methodology") }
];

export function PublicAtlasHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authState, setAuthState] = useState<"checking" | "signed-in" | "signed-out">("checking");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
      if (active) setAuthState("signed-out");
    }, 5000);
    void fetch("/api/auth-state", { cache: "no-store", credentials: "same-origin", signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ signedIn?: boolean }> : null)
      .then((result) => {
        if (active) setAuthState(result?.signedIn ? "signed-in" : "signed-out");
      })
      .catch(() => {
        if (active) setAuthState("signed-out");
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [pathname]);

  return (
    <header className="atlas-header">
      <div className="atlas-frame flex h-[74px] items-center justify-between gap-5 lg:h-[84px]">
        <Link href="/" className="flex min-w-0 items-center no-underline" aria-label="True North Map home">
          <span className="relative flex h-12 min-w-[142px] items-center rounded-[16px] bg-[var(--atlas-ink)] px-4 text-white shadow-[0_12px_28px_rgba(36,40,39,0.16)] sm:h-[58px] sm:min-w-[164px] sm:px-5">
            <span className="text-[13px] font-extrabold uppercase leading-[0.95rem] tracking-[0.11em] sm:text-[14px] sm:leading-[1rem]">
              <span className="block">True North</span>
              <span className="block">Map</span>
            </span>
            <ChevronUp className="absolute right-4 top-3 size-5 stroke-[3] text-[var(--atlas-signal)] sm:right-5 sm:top-4" aria-hidden="true" />
          </span>
        </Link>

        <nav className="hidden h-full items-center gap-3 lg:flex" aria-label="Public ecosystem map navigation">
          {navigation.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex h-11 items-center rounded-[15px] px-5 text-[14px] font-semibold text-[var(--atlas-muted)] no-underline hover:bg-[var(--atlas-surface-muted)] hover:text-[var(--atlas-ink)] hover:no-underline",
                  active && "bg-[var(--atlas-ink)] text-white hover:bg-[var(--atlas-ink)] hover:text-white"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
                {active ? <span className="absolute inset-x-5 -bottom-[8px] h-[4px] rounded-full bg-[var(--atlas-signal)]" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openBetaUpdates}
            className="atlas-secondary-button !hidden h-11 items-center gap-2 px-4 text-sm sm:!inline-flex"
          >
            <Bell className="size-4" />
            Get updates
          </button>
          {authState === "checking" ? (
            <span className="hidden h-11 w-[94px] items-center justify-center rounded-xl border border-[var(--atlas-border)] bg-white/70 text-[var(--atlas-muted)] sm:inline-flex" aria-label="Checking account status"><UserRound className="size-4" aria-hidden="true" /></span>
          ) : (
            <Link
              href={authState === "signed-in" ? "/account" : "/sign-in"}
              className="atlas-secondary-button !hidden h-11 items-center justify-center gap-2 px-4 text-sm sm:!inline-flex"
            >
              {authState === "signed-in" ? <UserRound className="size-4" aria-hidden="true" /> : null}
              {authState === "signed-in" ? "Account" : "Sign in"}
            </Link>
          )}
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-xl border border-[var(--atlas-border)] bg-white text-[var(--atlas-ink)] lg:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-[var(--atlas-border)] bg-white px-4 py-3 shadow-[0_16px_30px_rgba(36,40,39,0.09)] lg:hidden" aria-label="Mobile public ecosystem map navigation">
          <div className="atlas-frame grid gap-1">
            {navigation.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--atlas-muted)] no-underline hover:bg-white hover:text-[var(--atlas-ink)] hover:no-underline",
                    active && "bg-[var(--atlas-signal)] text-[var(--atlas-ink)]"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <button type="button" onClick={() => { openBetaUpdates(); setOpen(false); }} className="atlas-primary-button mt-2 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-center text-sm"><Bell className="size-4" />Get updates</button>
            {authState === "checking" ? (
              <span className="rounded-xl border border-[var(--atlas-border)] px-3 py-2.5 text-center text-sm font-semibold text-[var(--atlas-muted)]">Checking account…</span>
            ) : (
              <Link href={authState === "signed-in" ? "/account" : "/sign-in"} onClick={() => setOpen(false)} className="atlas-secondary-button inline-flex items-center justify-center gap-2 px-3 py-2.5 text-center text-sm">
                {authState === "signed-in" ? <UserRound className="size-4" aria-hidden="true" /> : null}
                {authState === "signed-in" ? "Account" : "Sign in"}
              </Link>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
