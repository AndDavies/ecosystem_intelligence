"use client";

import Link from "next/link";
import { Bell, Linkedin, MessageSquareText, Share2 } from "lucide-react";
import { openBetaFeedback, openBetaUpdates, trackNorthSignalCtaClick } from "@/lib/product-insights/client";
import { AnalyticsPreferencesButton } from "@/components/atlas/public-beta-insights";
import { BrandLogo } from "@/components/atlas/brand-logo";
import { officialSocialLinks } from "@/lib/site";

export function PublicAtlasFooter({ generatedLabel, variant = "compact" }: { generatedLabel?: string; variant?: "compact" | "landing" }) {
  const currentYear = new Date().getFullYear();
  if (variant === "landing") {
    return (
      <footer className="atlas-footer border-t border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] py-14 text-sm text-[var(--atlas-muted)]">
        <div className="atlas-frame grid gap-12 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr]">
          <div>
            <BrandLogo inverse />
            <p className="mt-6 text-lg font-extrabold text-[var(--atlas-ink)]">Make Canadian capability visible.</p>
            <p className="mt-2 max-w-sm leading-6">{generatedLabel ?? "Independent project by Andrew Davies."}</p>
          </div>
          <FooterColumn title="Explore" links={[["Map", "/map"], ["Directory", "/organizations"], ["Mission areas", "/missions"], ["Defence needs", "/demand"], ["Regions", "/regions"]]} />
          <FooterColumn title="Intelligence" links={[["Defence Signals", "/signals"], ["About North Signal", "/north-signal"], ["How It Works", "/how-it-works"]]} />
          <FooterColumn title="Trust & About" links={[["Methodology", "/methodology"], ["About True North Map", "/about"], ["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]]} />
        </div>
        <div className="atlas-frame mt-12 flex flex-col gap-5 border-t border-[var(--atlas-border)] pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} True North Map. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <button type="button" onClick={openBetaFeedback} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-[var(--atlas-ink)] hover:underline"><MessageSquareText className="size-3.5" aria-hidden="true" />Give feedback</button>
            <button type="button" onClick={() => openBetaUpdates("newsletter_footer")} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-[var(--atlas-ink)] hover:underline"><Bell className="size-3.5" aria-hidden="true" />Free weekly briefing</button>
            <a href={officialSocialLinks.linkedIn} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-3.5 font-semibold text-[var(--atlas-ink)] no-underline shadow-sm hover:bg-[var(--atlas-signal-soft)]"><Linkedin className="size-4 text-[var(--atlas-evidence)]" aria-hidden="true" />Follow us on LinkedIn<span className="sr-only"> (opens in a new tab)</span></a>
            <a href={officialSocialLinks.x} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-3.5 font-semibold text-[var(--atlas-ink)] no-underline shadow-sm hover:bg-[var(--atlas-signal-soft)]"><Share2 className="size-4 text-[var(--atlas-evidence)]" aria-hidden="true" />Follow us on X<span className="sr-only"> (opens in a new tab)</span></a>
            <AnalyticsPreferencesButton className="min-h-11 font-semibold text-[var(--atlas-ink)] hover:underline" />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="atlas-footer mt-10 bg-[var(--atlas-ink)] py-10 text-xs text-white/60">
      <div className="atlas-frame grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] lg:items-start">
        <div className="max-w-xl">
          <BrandLogo inverse />
          <p className="mt-5 text-base font-extrabold text-white">Make Canadian capability visible.</p>
          <p className="mt-2">{generatedLabel ?? "Independent project by Andrew Davies."}</p>
        </div>
        <nav aria-label="Footer" className="grid gap-6 sm:grid-cols-3">
          <CompactFooterColumn title="Explore" links={[["Map", "/map"], ["Directory", "/organizations"], ["Mission areas", "/missions"], ["Defence needs", "/demand"], ["Regions", "/regions"]]} />
          <CompactFooterColumn title="Intelligence" links={[["Defence Signals", "/signals"], ["About North Signal", "/north-signal"], ["How It Works", "/how-it-works"]]} />
          <CompactFooterColumn title="Trust & About" links={[["Methodology", "/methodology"], ["About", "/about"], ["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]]} />
        </nav>
      </div>
      <div className="atlas-frame mt-7 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-white/15 pt-6">
          <button type="button" onClick={openBetaFeedback} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-white hover:text-[var(--atlas-signal)] hover:underline"><MessageSquareText className="size-3.5" aria-hidden="true" />Give feedback</button>
          <button type="button" onClick={() => openBetaUpdates("newsletter_footer")} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-white hover:text-[var(--atlas-signal)] hover:underline"><Bell className="size-3.5" aria-hidden="true" />Free weekly briefing</button>
          <a href={officialSocialLinks.linkedIn} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-3.5 font-semibold text-white no-underline hover:bg-white/15 hover:text-[var(--atlas-signal)]"><Linkedin className="size-4" aria-hidden="true" />Follow us on LinkedIn<span className="sr-only"> (opens in a new tab)</span></a>
          <a href={officialSocialLinks.x} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-3.5 font-semibold text-white no-underline hover:bg-white/15 hover:text-[var(--atlas-signal)]"><Share2 className="size-4" aria-hidden="true" />Follow us on X<span className="sr-only"> (opens in a new tab)</span></a>
          <AnalyticsPreferencesButton className="min-h-11 font-semibold text-white/70 hover:text-[var(--atlas-signal)] hover:underline" />
        </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return <nav aria-label={title}><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--atlas-evidence)]">{title}</p><ul className="mt-5 space-y-3">{links.map(([label, href]) => <li key={href}><FooterLink href={href} label={label} className="font-medium text-[var(--atlas-ink)] no-underline hover:underline" /></li>)}</ul></nav>;
}

function CompactFooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return <div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--atlas-signal)]">{title}</p><ul className="mt-3 space-y-2.5">{links.map(([label, href]) => <li key={href}><FooterLink href={href} label={label} className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline" /></li>)}</ul></div>;
}

function FooterLink({ href, label, className }: { href: string; label: string; className: string }) {
  return <Link href={href} data-internal-link-role="global" data-internal-link-module="site_footer" onClick={href === "/north-signal" ? () => trackNorthSignalCtaClick("newsletter_footer", href) : undefined} className={className}>{label}</Link>;
}
