"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Network, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
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
      <div className="atlas-frame flex h-[72px] items-center justify-between gap-5">
        <Link href="/" className="flex min-w-0 items-center gap-3 no-underline" aria-label="True North Map home">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] border border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)] shadow-[0_8px_20px_rgba(30,35,32,0.07)]">
            <Network className="size-5" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 items-center gap-2.5 leading-tight">
            <span className="block truncate text-[14px] font-bold tracking-[-0.02em] text-[var(--atlas-ink)] sm:text-[17px]">True North Map</span>
            <span className="hidden rounded-full border border-[var(--atlas-border)] bg-white px-2 py-1 text-[10px] font-semibold text-[var(--atlas-muted)] sm:inline-flex">Public Beta</span>
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
                  "relative flex items-center px-1 text-[15px] font-medium text-[var(--atlas-muted)] no-underline hover:text-[var(--atlas-ink)] hover:no-underline",
                  active && "text-[var(--atlas-ink)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
                {active ? <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-[var(--atlas-coral)]" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openPilotUpdates}
            className="atlas-secondary-button hidden h-10 items-center gap-2 px-4 text-sm sm:inline-flex"
          >
            <Bell className="size-4" />
            Get updates
          </button>
          {authState === "checking" ? (
            <span className="hidden h-10 w-[94px] items-center justify-center rounded-xl border border-[var(--atlas-border)] bg-white/70 text-[var(--atlas-muted)] sm:inline-flex" aria-label="Checking account status"><UserRound className="size-4" aria-hidden="true" /></span>
          ) : (
            <Link
              href={authState === "signed-in" ? "/account" : "/sign-in"}
              className="atlas-secondary-button hidden h-10 items-center justify-center gap-2 px-4 text-sm sm:inline-flex"
            >
              {authState === "signed-in" ? <UserRound className="size-4" aria-hidden="true" /> : null}
              {authState === "signed-in" ? "Account" : "Sign in"}
            </Link>
          )}
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-xl border border-[var(--atlas-border)] bg-white text-[var(--atlas-ink)] lg:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-[var(--atlas-border)] bg-[var(--atlas-canvas)] px-4 py-3 shadow-[0_16px_30px_rgba(30,35,32,0.09)] lg:hidden" aria-label="Mobile public atlas navigation">
          <div className="atlas-frame grid gap-1">
            {navigation.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--atlas-muted)] no-underline hover:bg-white hover:text-[var(--atlas-ink)] hover:no-underline",
                    active && "bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <button type="button" onClick={() => { openPilotUpdates(); setOpen(false); }} className="atlas-primary-button mt-2 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-center text-sm"><Bell className="size-4" />Get updates</button>
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
