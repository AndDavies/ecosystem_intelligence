"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { brandCopy } from "@/lib/brand-copy";
import { evidenceStrengthLabel, publicLanguage } from "@/lib/atlas/presentation";
import { formatDate } from "@/lib/utils";
import type { AtlasConfidence, AtlasCoverageSummary, AtlasMapOrganization, AtlasMissionIndexItem } from "@/types/atlas";

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
  signals: Array<{ slug: string; title: string; editionDate: string; summary: string; heroImage: { url: string; alt: string; attribution: string; sourceUrl: string } | null }>;
};

export type LandingSignalSummary = LandingData["signals"][number];

let landingDataPromise: Promise<LandingData> | null = null;

function loadLandingData() {
  landingDataPromise ??= fetch("/api/landing", { headers: { Accept: "application/json" } }).then(async (response) => {
    if (!response.ok) throw new Error("The current reviewed landing records could not be loaded.");
    return response.json() as Promise<LandingData>;
  }).catch((error) => { landingDataPromise = null; throw error; });
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

export function LandingProductPreview() {
  const { data, failed } = useLandingData();
  return <section className="atlas-frame py-9 sm:py-12" aria-labelledby="preview-heading">
    <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-start lg:gap-12">
      <div><p className="atlas-eyebrow">From the directory</p><h2 id="preview-heading" className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.035em]">{brandCopy.slogan}</h2><p className="mt-4 text-base leading-7 text-[var(--atlas-muted)]">Every profile gives you a place to start: what a team offers, where it may help, and the public evidence you can check.</p>{data ? <p className="mt-4 text-sm font-semibold">{data.summary.organizations.toLocaleString("en-CA")} published organizations · {data.summary.capabilities.toLocaleString("en-CA")} technologies and services</p> : null}</div>
      {data?.preview ? <PreviewRecord preview={data.preview} /> : <div className="border-t border-[var(--atlas-border-strong)] py-6" role="status"><p className="text-sm text-[var(--atlas-muted)]">{failed || data ? "The current example is temporarily unavailable." : "Loading a current profile…"}</p><Link href="/organizations" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold underline underline-offset-4">Browse the directory <ArrowRight className="size-4" /></Link></div>}
    </div>
  </section>;
}

function PreviewRecord({ preview }: { preview: NonNullable<LandingData["preview"]> }) {
  const { organizationName, organizationSlug, locationName, logoUrl, capability } = preview;
  return <article className="border-t-2 border-[var(--atlas-ink)] py-5 sm:py-7">
    <div className="flex items-center gap-4">{logoUrl ? <div className="relative h-12 w-24 shrink-0"><Image src={logoUrl} alt={`${organizationName} logo`} fill sizes="96px" className="object-contain" /></div> : null}<div><h3 className="text-xl font-extrabold">{organizationName}</h3><p className="mt-1 text-sm text-[var(--atlas-muted)]">{locationName}</p></div></div>
    <h4 className="mt-5 text-lg font-extrabold">{capability.name}</h4>
    <p className="mt-2 text-xs font-bold">{publicLanguage.sourceFact}</p><p className="mt-1 text-sm leading-6 text-[var(--atlas-ink-soft)]">{capability.summary}</p>
    <div className="atlas-preview-assessment mt-5 border-l-4 border-[var(--atlas-signal)] bg-[var(--atlas-ink)] p-5 text-white"><p className="text-xs font-extrabold text-[var(--atlas-signal)]">{publicLanguage.assessment} · Where this could help</p><p className="mt-1 text-sm leading-6">{capability.assessment}</p>{capability.gap ? <p className="mt-3 text-sm leading-6"><strong>What still needs checking:</strong> {capability.gap}</p> : null}</div>
    <p className="mt-3 text-xs leading-5 text-[var(--atlas-muted)]">{publicLanguage.evidenceStrength}: {evidenceStrengthLabel(capability.sourceConfidence)} · {publicLanguage.lastReviewed}: {formatDate(capability.lastReviewedAt)}</p>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1"><Link href={`/organizations/${organizationSlug}`} prefetch={false} className="atlas-signal-button min-h-11 gap-2 px-5 text-sm">Open {organizationName} profile <ArrowRight className="size-4" /></Link><Link href={`/capabilities/${capability.slug}#evidence`} className="atlas-prose-link inline-flex min-h-11 items-center text-sm font-bold">Check the sources</Link></div>
  </article>;
}
