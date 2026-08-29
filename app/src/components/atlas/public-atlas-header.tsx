"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, MessageSquareText, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/atlas/brand-logo";
import { cn } from "@/lib/utils";
import { openBetaFeedback, openBetaUpdates } from "@/lib/product-insights/client";

const navigation = [
  { href: "/map", label: "Map", match: (pathname: string) => pathname === "/map" },
  { href: "/organizations", label: "Organizations", match: (pathname: string) => pathname.startsWith("/organizations") },
  { href: "/missions", label: "Missions", match: (pathname: string) => pathname.startsWith("/missions") },
  { href: "/demand", label: "Public Needs", match: (pathname: string) => pathname.startsWith("/demand") },
  { href: "/signals", label: "Defence Signals", match: (pathname: string) => pathname.startsWith("/signals") },
  { href: "/how-it-works", label: "How It Works", match: (pathname: string) => pathname.startsWith("/how-it-works") },
  { href: "/about", label: "About", match: (pathname: string) => pathname.startsWith("/about") || pathname.startsWith("/methodology") }
];

const mobileNavigationId = "public-atlas-mobile-navigation";

export function PublicAtlasHeader({ privateWorkspace = false }: { privateWorkspace?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authState, setAuthState] = useState<"checking" | "signed-in" | "signed-out">(privateWorkspace ? "signed-in" : "checking");
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (privateWorkspace) {
      setAuthState("signed-in");
      return;
    }
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
  }, [pathname, privateWorkspace]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="atlas-header border-b-2 border-[var(--atlas-signal)] font-[family-name:var(--font-inter)]">
      <div className="atlas-frame flex h-[70px] items-center justify-between gap-4 lg:h-[76px]">
        <Link href="/" prefetch={!privateWorkspace} className="flex min-w-0 items-center no-underline" aria-label="True North Map home">
          <BrandLogo />
        </Link>

         <nav className="hidden h-full items-center gap-1 2xl:gap-2 xl:flex" aria-label="Public ecosystem map navigation">
          {navigation.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={!privateWorkspace}
                className={cn(
                  "relative flex h-10 items-center rounded-[8px] px-2.5 text-[12px] font-semibold text-[var(--atlas-muted)] no-underline hover:bg-[var(--atlas-surface-muted)] hover:text-[var(--atlas-ink)] hover:no-underline 2xl:px-3.5 2xl:text-[13px]",
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
          {!privateWorkspace ? <button
            type="button"
            onClick={() => openBetaUpdates("newsletter_header")}
            className="atlas-secondary-button !hidden h-11 items-center gap-2 px-4 text-sm sm:!inline-flex"
          >
            <Bell className="size-4" aria-hidden="true" />
            Subscribe to the free newsletter
          </button> : null}
          {!privateWorkspace ? <button
            type="button"
            onClick={openBetaFeedback}
            className="atlas-secondary-button !hidden size-11 items-center justify-center sm:!inline-flex"
            aria-label="Give feedback"
          >
            <MessageSquareText className="size-4" aria-hidden="true" />
          </button> : null}
          {authState === "checking" ? (
            <span className="hidden h-11 w-[94px] items-center justify-center rounded-xl border border-[var(--atlas-border)] bg-white/70 text-[var(--atlas-muted)] sm:inline-flex" aria-label="Checking account status"><UserRound className="size-4" aria-hidden="true" /></span>
          ) : (
            <Link
              href={authState === "signed-in" ? "/account" : "/sign-in"}
              prefetch={!privateWorkspace}
              className="atlas-secondary-button !hidden h-11 items-center justify-center gap-2 px-4 text-sm sm:!inline-flex"
            >
              {authState === "signed-in" ? <UserRound className="size-4" aria-hidden="true" /> : null}
              {authState === "signed-in" ? "Account" : "Sign in"}
            </Link>
          )}
          <button
            ref={menuButtonRef}
            type="button"
            data-north-signal-mobile-return-focus
            className="flex size-11 items-center justify-center rounded-[9px] border border-[var(--atlas-border)] bg-white text-[var(--atlas-ink)] xl:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls={mobileNavigationId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav id={mobileNavigationId} className="border-t border-[var(--atlas-border)] bg-white px-4 py-3 shadow-[0_16px_30px_rgba(36,40,39,0.09)] xl:hidden" aria-label="Mobile public ecosystem map navigation">
          <div className="atlas-frame grid gap-1">
            {navigation.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={!privateWorkspace}
                  className={cn(
                    "flex min-h-11 items-center rounded-[8px] px-3 py-2.5 text-sm font-medium text-[var(--atlas-muted)] no-underline hover:bg-white hover:text-[var(--atlas-ink)] hover:no-underline",
                    active && "bg-[var(--atlas-signal)] text-[var(--atlas-ink)]"
                  )}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            {!privateWorkspace ? <button type="button" onClick={() => { openBetaUpdates("newsletter_header"); setOpen(false); }} className="atlas-primary-button mt-2 inline-flex min-h-11 items-center justify-center gap-2 px-3 py-2.5 text-center text-sm"><Bell className="size-4" aria-hidden="true" />Subscribe to the free newsletter</button> : null}
            {!privateWorkspace ? <button type="button" onClick={() => { openBetaFeedback(); setOpen(false); }} className="atlas-secondary-button inline-flex min-h-11 items-center justify-center gap-2 px-3 py-2.5 text-center text-sm"><MessageSquareText className="size-4" aria-hidden="true" />Give feedback</button> : null}
            {authState === "checking" ? (
              <span className="flex min-h-11 items-center justify-center rounded-xl border border-[var(--atlas-border)] px-3 py-2.5 text-center text-sm font-semibold text-[var(--atlas-muted)]">Checking account…</span>
            ) : (
              <Link href={authState === "signed-in" ? "/account" : "/sign-in"} prefetch={!privateWorkspace} onClick={() => setOpen(false)} className="atlas-secondary-button inline-flex min-h-11 items-center justify-center gap-2 px-3 py-2.5 text-center text-sm">
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
