"use client";

import Link from "next/link";
import { Bell, Linkedin, MessageSquareText, Share2 } from "lucide-react";
import { openBetaFeedback, openBetaUpdates } from "@/lib/product-insights/client";
import { AnalyticsPreferencesButton } from "@/components/atlas/public-beta-insights";
import { BrandLogo } from "@/components/atlas/brand-logo";
import { officialSocialLinks } from "@/lib/site";

export function PublicAtlasFooter({ generatedLabel, variant = "compact" }: { generatedLabel?: string; variant?: "compact" | "landing" }) {
  const currentYear = new Date().getFullYear();
  if (variant === "landing") {
    return (
      <footer className="border-t border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] py-14 text-sm text-[var(--atlas-muted)]">
        <div className="atlas-frame grid gap-12 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr]">
          <div>
            <BrandLogo />
            <p className="mt-6 text-lg font-extrabold text-[var(--atlas-ink)]">Make Canadian capability visible.</p>
            <p className="mt-2 max-w-sm leading-6">{generatedLabel ?? "Independent project by Andrew Davies. Reviewed public evidence, transparent gaps, human review."}</p>
          </div>
          <FooterColumn title="Explore" links={[["Map", "/map"], ["Organizations", "/organizations"], ["Missions", "/missions"], ["Public Needs", "/demand"]]} />
          <FooterColumn title="Resources" links={[["Signals", "/signals"], ["Defence Briefs", "/briefs"], ["How It Works", "/how-it-works"], ["Methodology", "/methodology"], ["Regions", "/regions"]]} />
          <FooterColumn title="About" links={[["About True North Map", "/about"], ["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]]} />
        </div>
        <div className="atlas-frame mt-12 flex flex-col gap-5 border-t border-[var(--atlas-border)] pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} True North Map. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <button type="button" onClick={openBetaFeedback} className="inline-flex items-center gap-1.5 font-semibold text-[var(--atlas-ink)] hover:underline"><MessageSquareText className="size-3.5" />Give feedback</button>
            <button type="button" onClick={() => openBetaUpdates("newsletter_footer")} className="inline-flex items-center gap-1.5 font-semibold text-[var(--atlas-ink)] hover:underline"><Bell className="size-3.5" />North Signal</button>
            <a href={officialSocialLinks.linkedIn} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-3.5 font-semibold text-[var(--atlas-ink)] no-underline shadow-sm hover:bg-[var(--atlas-signal-soft)]"><Linkedin className="size-4 text-[var(--atlas-evidence)]" aria-hidden="true" />Follow us on LinkedIn</a>
            <a href={officialSocialLinks.x} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-3.5 font-semibold text-[var(--atlas-ink)] no-underline shadow-sm hover:bg-[var(--atlas-signal-soft)]"><Share2 className="size-4 text-[var(--atlas-evidence)]" aria-hidden="true" />Follow us on X</a>
            <AnalyticsPreferencesButton className="font-semibold text-[var(--atlas-ink)] hover:underline" />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-10 rounded-2xl bg-[var(--atlas-ink)] px-5 py-7 text-xs text-white/60 sm:px-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <BrandLogo inverse />
          <p className="mt-5 text-base font-extrabold text-white">Make Canadian capability visible.</p>
          <p className="mt-2">{generatedLabel ?? "Independent project by Andrew Davies. Reviewed public evidence, transparent gaps, human review."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" onClick={openBetaFeedback} className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-[var(--atlas-signal)] hover:underline"><MessageSquareText className="size-3.5" />Give feedback</button>
          <button type="button" onClick={() => openBetaUpdates("newsletter_footer")} className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-[var(--atlas-signal)] hover:underline"><Bell className="size-3.5" />North Signal</button>
          <a href={officialSocialLinks.linkedIn} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/10 px-3.5 font-semibold text-white no-underline hover:bg-white/15 hover:text-[var(--atlas-signal)]"><Linkedin className="size-4" aria-hidden="true" />Follow us on LinkedIn</a>
          <a href={officialSocialLinks.x} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/10 px-3.5 font-semibold text-white no-underline hover:bg-white/15 hover:text-[var(--atlas-signal)]"><Share2 className="size-4" aria-hidden="true" />Follow us on X</a>
          <AnalyticsPreferencesButton className="font-semibold text-white/70 hover:text-[var(--atlas-signal)] hover:underline" />
          <Link href="/privacy" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Privacy</Link>
          <Link href="/methodology" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Methodology</Link>
          <Link href="/how-it-works" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">How It Works</Link>
          <Link href="/regions" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Regions</Link>
          <Link href="/missions" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Mission Areas</Link>
          <Link href="/contact" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Contact</Link>
          <Link href="/terms" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Terms</Link>
          <Link href="/briefs" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Canadian Defence Briefs</Link>
          <Link href="/signals" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Canadian Defence Signals</Link>
          <Link href="/demand" className="font-semibold text-white/70 no-underline hover:text-[var(--atlas-signal)] hover:underline">Public Needs</Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--atlas-evidence)]">{title}</p><ul className="mt-5 space-y-3">{links.map(([label, href]) => <li key={href}><Link href={href} className="font-medium text-[var(--atlas-ink)] no-underline hover:underline">{label}</Link></li>)}</ul></div>;
}
