"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, MessageSquareText, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/atlas/brand-logo";
import { cn } from "@/lib/utils";
import { openBetaFeedback, openBetaUpdates } from "@/lib/product-insights/client";

const navigation = [
  { href: "/", label: "Map", match: (pathname: string) => pathname === "/" || pathname.startsWith("/regions") },
  { href: "/organizations", label: "Organizations", match: (pathname: string) => pathname.startsWith("/organizations") },
  { href: "/demand", label: "Public Needs", match: (pathname: string) => pathname.startsWith("/demand") },
  { href: "/briefs", label: "Defence Briefs", match: (pathname: string) => pathname.startsWith("/briefs") },
  { href: "/how-it-works", label: "How It Works", match: (pathname: string) => pathname.startsWith("/how-it-works") },
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
    <header className="atlas-header border-b-2 border-[var(--atlas-signal)]">
      <div className="atlas-frame flex h-[70px] items-center justify-between gap-4 lg:h-[76px]">
        <Link href="/" className="flex min-w-0 items-center no-underline" aria-label="True North Map home">
          <BrandLogo />
        </Link>

         <nav className="hidden h-full items-center gap-3 xl:flex" aria-label="Public ecosystem map navigation">
          {navigation.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex h-10 items-center rounded-xl px-3 text-[12px] font-semibold text-[var(--atlas-muted)] no-underline hover:bg-[var(--atlas-surface-muted)] hover:text-[var(--atlas-ink)] hover:no-underline xl:px-4 xl:text-[13px]",
                  active && "text-[var(--atlas-ink)] hover:text-[var(--atlas-ink)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
                {active ? <span className="absolute inset-x-4 -bottom-[17px] h-[3px] rounded-full bg-[var(--atlas-signal)]" /> : null}
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
             className="flex size-11 items-center justify-center rounded-xl border border-[var(--atlas-border)] bg-white text-[var(--atlas-ink)] xl:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
         <nav className="border-t border-[var(--atlas-border)] bg-white px-4 py-3 shadow-[0_16px_30px_rgba(36,40,39,0.09)] xl:hidden" aria-label="Mobile public ecosystem map navigation">
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
            <button type="button" onClick={() => { openBetaFeedback(); setOpen(false); }} className="atlas-secondary-button inline-flex items-center justify-center gap-2 px-3 py-2.5 text-center text-sm"><MessageSquareText className="size-4" />Give feedback</button>
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
