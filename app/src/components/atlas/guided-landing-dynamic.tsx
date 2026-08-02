"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Compass,
  Cpu,
  FileText,
  Info,
  Layers3,
  MountainSnow,
  ShieldCheck,
  Waves
} from "lucide-react";
import { useEffect, useState } from "react";
import { BriefHero } from "@/components/atlas/brief-hero";
import { LandingEntryLink } from "@/components/atlas/landing-entry-link";
import { LandingMapPreview } from "@/components/atlas/landing-map-preview";
import { evidenceStrengthLabel, locationAccuracyLabel, publicLanguage } from "@/lib/atlas/presentation";
import { formatDate } from "@/lib/utils";
import type { AtlasConfidence, AtlasCoverageSummary, AtlasMapOrganization, AtlasMissionIndexItem } from "@/types/atlas";

type BriefPresentation = React.ComponentProps<typeof BriefHero>["presentation"];
type LandingData = {
  summary: AtlasCoverageSummary;
  preview: null | {
    organization: AtlasMapOrganization;
    organizationName: string;
    organizationSlug: string;
    locationName: string;
    logoUrl: string | null;
    capability: {
      id: string;
      slug: string;
      name: string;
      summary: string;
      sourceConfidence: AtlasConfidence;
      lastReviewedAt: string | null;
      assessment: string;
      gap: string | null;
    };
  };
  missions: AtlasMissionIndexItem[];
  briefs: Array<{ slug: string; title: string; topic: string; standfirst: string; readingMinutes: number; presentation: BriefPresentation }>;
};

let landingDataPromise: Promise<LandingData> | null = null;

function loadLandingData() {
  landingDataPromise ??= fetch("/api/landing", { headers: { Accept: "application/json" } }).then(async (response) => {
    if (!response.ok) throw new Error("The current reviewed landing records could not be loaded.");
    return response.json() as Promise<LandingData>;
  });
  return landingDataPromise;
}

function useLandingData() {
  const [data, setData] = useState<LandingData | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void loadLandingData().then((result) => { if (active) setData(result); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  return { data, failed };
}

export function LandingCoverage() {
  const { data, failed } = useLandingData();
  if (!data) return <div className="h-[126px] animate-pulse border-b border-[var(--atlas-border)] bg-white sm:h-[88px]" aria-label={failed ? "Coverage is temporarily unavailable" : "Loading current coverage"} />;
  return <section className="border-b border-[var(--atlas-border)] bg-white"><div className="atlas-frame grid gap-0 py-3 sm:grid-cols-2 sm:py-4 lg:grid-cols-[1fr_1fr_1fr_1.12fr] lg:items-center"><Metric icon={Building2} value={data.summary.organizations} label="Published organizations" /><Metric icon={Cpu} value={data.summary.capabilities} label="Reviewed technologies" /><Metric icon={FileText} value={data.summary.sources} label="Cited public sources" /><p className="flex min-h-[58px] items-center gap-4 border-t border-[var(--atlas-border)] pt-4 text-sm font-medium leading-6 text-[var(--atlas-muted)] sm:border-l sm:border-t-0 sm:px-5 sm:pt-0 lg:border-l-0 lg:px-7"><span className="size-2.5 shrink-0 rounded-full bg-[var(--atlas-evidence)]" />Updated as reviewed records are published.</p></div></section>;
}

function Metric({ icon: Icon, value, label }: { icon: typeof Building2; value: number; label: string }) { return <div className="flex min-h-[58px] items-center gap-4 border-b border-[var(--atlas-border)] py-3 sm:border-b-0 sm:px-5 lg:border-r lg:px-7"><Icon className="size-7 shrink-0 text-[var(--atlas-evidence)]" aria-hidden="true" /><div><strong className="block font-[family-name:var(--font-barlow)] text-2xl font-extrabold tracking-[-0.04em]">{value.toLocaleString("en-CA")}</strong><span className="mt-0.5 block text-sm text-[var(--atlas-muted)]">{label}</span></div></div>; }

export function LandingProductPreview() {
  const { data, failed } = useLandingData();
  if (!data) return <SectionFallback label={failed ? "The reviewed product example is temporarily unavailable." : "Loading the reviewed product example…"} />;
  if (!data.preview) return <SectionFallback label="The reviewed product example is temporarily unavailable." />;
  const { organization, organizationName, organizationSlug, locationName, logoUrl, capability } = data.preview;
  const coverageGap = capability.gap ?? "No additional verified public detail is currently published.";
  const locationAccuracy = organization.primaryLocation ? locationAccuracyLabel(organization.primaryLocation.geographicConfidence) : "Location not verified";
  return (
    <section className="border-y border-[var(--atlas-border)] bg-white py-16 sm:py-20" aria-labelledby="preview-heading">
      <div className="atlas-frame">
        <div className="mb-8 max-w-3xl sm:mb-10">
          <p className="atlas-eyebrow">See a reviewed result</p>
          <h2 id="preview-heading" className="mt-4 text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">See where capability is and why it may matter.</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--atlas-muted)]">Move from a location on the map into a reviewed technology record. See what the public record says, where the technology may fit and what remains unknown.</p>
        </div>
        <div className="overflow-hidden rounded-[16px] border border-[var(--atlas-border)] bg-white shadow-[var(--atlas-shadow-soft)]">
          <div className="relative aspect-[16/9] overflow-hidden border-b border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] sm:aspect-[16/7]">
            <LandingMapPreview organization={organization} />
            <div className="absolute inset-x-4 bottom-4 border-l-4 border-[var(--atlas-signal)] bg-white/95 px-4 py-3 shadow-[var(--atlas-shadow-soft)] backdrop-blur-sm sm:inset-x-auto sm:left-6 sm:max-w-[320px]">
              <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-evidence)]">Selected on the map</p>
              <p className="mt-1 text-base font-extrabold text-[var(--atlas-ink)]">{organizationName}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">{locationName} · {locationAccuracy} location</p>
            </div>
          </div>
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-5 border-b border-[var(--atlas-border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                {logoUrl ? <span className="relative flex h-20 w-40 shrink-0 items-center justify-center rounded-[10px] border border-[var(--atlas-border)] bg-white p-3"><Image src={logoUrl} alt={`${organizationName} logo`} fill sizes="160px" className="object-contain p-3" /></span> : null}
                <div><h3 className="text-3xl font-extrabold tracking-[-0.04em]">{organizationName}</h3><p className="mt-2 text-sm text-[var(--atlas-muted)]">Organization · {locationName}</p><p className="mt-1 text-xs text-[var(--atlas-muted)]">{locationAccuracy} location</p></div>
              </div>
              <div className="text-left text-xs leading-5 text-[var(--atlas-muted)] sm:text-right"><strong className="inline-flex items-center gap-1 text-[var(--atlas-evidence)]">{publicLanguage.evidenceStrength}: {evidenceStrengthLabel(capability.sourceConfidence)}<EvidenceStrengthDisclosure /></strong><span className="mt-1 block">{publicLanguage.lastReviewed} {formatDate(capability.lastReviewedAt)}</span></div>
            </div>
            <div className="py-7"><h4 className="text-2xl font-extrabold tracking-[-0.025em]">{capability.name}</h4><p className="mt-3 max-w-3xl text-base leading-7 text-[var(--atlas-muted)]">{capability.summary}</p></div>
            <div className="grid gap-4 lg:grid-cols-3"><EvidenceCard icon={CheckCircle2} heading="What the public record says" label={publicLanguage.sourceFact} text={capability.summary} tone="fact" /><EvidenceCard icon={ShieldCheck} heading="Where it may fit" label={publicLanguage.assessment} text={capability.assessment} tone="assessment" /><EvidenceCard icon={Layers3} heading="What remains unknown" label={publicLanguage.coverageGap} text={coverageGap} tone="gap" /></div>
            <div className="mt-7 grid border-t border-[var(--atlas-border)] sm:grid-cols-3"><Link href={`/organizations/${organizationSlug}`} className="flex min-h-12 items-center justify-center gap-2 border-b border-[var(--atlas-border)] px-4 text-sm font-bold text-[var(--atlas-ink)] no-underline hover:bg-[var(--atlas-surface-muted)] sm:border-b-0 sm:border-r">Open profile <ArrowRight className="size-4" /></Link><Link href={`/capabilities/${capability.slug}#evidence`} className="flex min-h-12 items-center justify-center gap-2 border-b border-[var(--atlas-border)] px-4 text-sm font-bold text-[var(--atlas-ink)] no-underline hover:bg-[var(--atlas-surface-muted)] sm:border-b-0 sm:border-r">Inspect evidence <ArrowRight className="size-4" /></Link><Link href={`/collections?addType=capability&addId=${capability.id}&returnTo=${encodeURIComponent(`/capabilities/${capability.slug}`)}`} className="flex min-h-12 items-center justify-center gap-2 px-4 text-sm font-bold text-[var(--atlas-ink)] no-underline hover:bg-[var(--atlas-surface-muted)]">Add to Working List <ArrowRight className="size-4" /></Link></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EvidenceCard({ icon: Icon, heading, label, text, tone }: { icon: typeof CheckCircle2; heading: string; label: string; text: string; tone: "fact" | "assessment" | "gap" }) { const toneClass = tone === "fact" ? "text-[var(--atlas-evidence)]" : tone === "gap" ? "text-[var(--atlas-amber)]" : "text-[var(--atlas-ink)]"; return <div className="min-h-[220px] rounded-[12px] border border-[var(--atlas-border)] p-5"><p className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] ${toneClass}`}><Icon className="size-4" />{label}</p><h4 className="mt-4 text-lg font-extrabold leading-6 tracking-[-0.02em] text-[var(--atlas-ink)]">{heading}</h4><p className="mt-3 text-sm leading-6 text-[var(--atlas-ink-soft)]">{text}</p></div>; }

function EvidenceStrengthDisclosure() {
  const [open, setOpen] = useState(false);
  return <span className="relative inline-flex"><button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex size-5 items-center justify-center rounded-full text-[var(--atlas-evidence)] hover:bg-[var(--atlas-evidence-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-evidence)]" aria-expanded={open} aria-controls="landing-evidence-strength-detail" aria-label="Explain evidence strength"><Info className="size-3.5" /></button>{open ? <span id="landing-evidence-strength-detail" role="status" className="absolute right-0 top-7 z-10 w-72 rounded-[8px] border border-[var(--atlas-border)] bg-white p-3 text-left text-xs font-medium leading-5 text-[var(--atlas-ink-soft)] shadow-[var(--atlas-shadow-float)]">Describes the available public-source support for this record. It is not a rating of the organization, procurement eligibility or endorsement.</span> : null}</span>;
}

export function LandingEditorialPaths() {
  const { data, failed } = useLandingData();
  if (!data) return <SectionFallback label={failed ? "Mission areas and Defence Briefs are temporarily unavailable." : "Loading mission areas and Defence Briefs…"} />;
  return <>
    <section className="py-16 sm:py-20" aria-labelledby="missions-heading"><div className="atlas-frame"><p className="atlas-eyebrow">Carry it forward</p><div className="mt-5 grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14"><div><p className="atlas-eyebrow">Mission Areas</p><h2 id="missions-heading" className="mt-4 text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">Start with an operational problem.</h2><p className="mt-5 max-w-md text-lg leading-8 text-[var(--atlas-muted)]">Compare reviewed technologies, organizations and visible gaps connected to each Mission Area.</p><LandingEntryLink href="/missions" entryPath="mission" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--atlas-evidence)] underline decoration-[var(--atlas-evidence)] decoration-2 underline-offset-4">Explore all Mission Areas <ArrowRight className="size-4" /></LandingEntryLink></div><div className="grid md:grid-cols-2">{data.missions.map((item) => <MissionLink key={item.missionArea.slug} item={item} />)}</div></div></div></section>
    <section className="border-t border-[var(--atlas-border)] bg-white py-16 sm:py-20" aria-labelledby="briefs-heading"><div className="atlas-frame grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14"><div><p className="atlas-eyebrow">Defence Briefs</p><h2 id="briefs-heading" className="mt-4 text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">Understand what may shape what Canada builds next.</h2><p className="mt-5 max-w-md text-base leading-7 text-[var(--atlas-muted)]">Defence Briefs connect policy, released needs and Canadian capability in source-linked analysis. Each one leads back into the organizations and technologies behind the story.</p><LandingEntryLink href="/briefs" entryPath="brief" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--atlas-evidence)] underline decoration-[var(--atlas-evidence)] decoration-2 underline-offset-4">Read Defence Briefs <ArrowRight className="size-4" /></LandingEntryLink></div><div className="grid gap-6 md:grid-cols-2">{data.briefs.map((brief) => <LandingEntryLink key={brief.slug} href={`/briefs/${brief.slug}`} entryPath="brief" aria-label={`Read Defence Brief: ${brief.title}`} className="group overflow-hidden rounded-[14px] border border-[var(--atlas-border)] bg-white text-[var(--atlas-ink)] no-underline transition hover:-translate-y-0.5 hover:shadow-[var(--atlas-shadow-soft)] hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-evidence)] focus-visible:ring-offset-4"><BriefHero presentation={brief.presentation} title={brief.title} compact className="h-[220px] rounded-none sm:h-[250px]" /><div className="p-6"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--atlas-evidence)]">{brief.topic} · {brief.readingMinutes} min read</p><h3 className="mt-4 text-2xl font-extrabold leading-tight tracking-[-0.035em]">{brief.title}</h3><p className="mt-4 line-clamp-3 text-base leading-7 text-[var(--atlas-muted)]">{brief.standfirst}</p><span className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold underline decoration-[var(--atlas-signal)] decoration-2 underline-offset-4">Read the brief <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></div></LandingEntryLink>)}</div></div></section>
  </>;
}

const missionIcons = { "autonomous-patrol-and-monitoring": Bot, "underwater-isr": Waves, "arctic-domain-awareness": MountainSnow, "edge-data-processing": Cpu } as const;

function MissionLink({ item }: { item: AtlasMissionIndexItem }) { const Icon = missionIcons[item.missionArea.slug as keyof typeof missionIcons] ?? Compass; return <Link href={`/missions/${item.missionArea.slug}`} aria-label={`Explore mission area: ${item.missionArea.name}`} className="group grid min-h-[210px] grid-cols-[58px_1fr_auto] gap-5 border-b border-[var(--atlas-border)] p-6 no-underline transition-colors hover:bg-white hover:no-underline focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-evidence)] focus-visible:ring-inset md:[&:nth-child(odd)]:border-r"><span className="flex size-14 items-center justify-center rounded-full bg-[var(--atlas-surface-muted)] text-[var(--atlas-evidence)]"><Icon className="size-7" /></span><div><h3 className="text-xl font-extrabold tracking-[-0.025em] text-[var(--atlas-ink)]">{item.missionArea.name}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--atlas-muted)]">{item.missionArea.summary}</p><p className="mt-4 text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-evidence)]">{item.capabilityCount.toLocaleString("en-CA")} reviewed {item.capabilityCount === 1 ? "technology" : "technologies"}</p></div><ArrowRight className="mt-auto size-5 text-[var(--atlas-ink)] transition-transform group-hover:translate-x-1" /></Link>; }

function SectionFallback({ label }: { label: string }) { return <section className="atlas-frame py-20 sm:py-24" aria-live="polite"><div className="h-[420px] animate-pulse border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)]" /><p className="mt-3 text-center text-sm font-semibold text-[var(--atlas-muted)]">{label}</p></section>; }
