"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookmarkPlus,
  Check,
  ExternalLink,
  Lightbulb,
  MessageCircleQuestion,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  ThumbsUp
} from "lucide-react";
import { openBetaFeedback, trackBetaEvent } from "@/lib/product-insights/client";
import { cn } from "@/lib/utils";
import type {
  AtlasAssistantFallbackReason,
  AtlasAssistantQuota,
  AtlasCitation,
  AtlasDiscoveryResult,
  AtlasOrganization
} from "@/types/atlas";

const outcomeCopy = {
  exact_match: {
    label: "Strong fit found",
    detail: "The published evidence supports at least one direct fit."
  },
  closest_supported: {
    label: "Closest supported fits",
    detail: "No complete match is visible yet. These organizations may cover part of the need."
  },
  coverage_gap: {
    label: "Coverage gap",
    detail: "The current public records do not support a defensible match yet."
  }
} as const;

const fallbackCopy: Record<AtlasAssistantFallbackReason, string> = {
  quota: "You have reached today’s question limit. Sign in for more questions, or keep exploring with the map and filters.",
  unavailable: "Ask True North is temporarily unavailable. The map is showing the closest deterministic search results instead.",
  timeout: "The assessment took too long. The map is showing the closest deterministic search results instead.",
  refusal: "That question could not be assessed safely. Try a public, non-sensitive capability need.",
  invalid_output: "The assessment could not be verified. The map is showing the closest deterministic search results instead."
};

function allCitations(organization: AtlasOrganization) {
  return [
    ...organization.citations,
    ...organization.capabilities.flatMap((capability) => [
      ...capability.citations,
      ...capability.missionMatches.flatMap((match) => match.citations),
      ...capability.demandMatches.flatMap((match) => match.citations)
    ])
  ];
}

function citationMap(organizations: AtlasOrganization[]) {
  return new Map<string, AtlasCitation>(
    organizations.flatMap(allCitations).map((citation) => [citation.id, citation])
  );
}

export function AssistantFallback({
  reason,
  quota
}: {
  reason: AtlasAssistantFallbackReason;
  quota?: AtlasAssistantQuota;
}) {
  return (
    <aside className="mt-4 flex flex-col gap-3 rounded-[20px] border border-[var(--atlas-amber)]/30 bg-[var(--atlas-amber-soft)] p-4 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
      <div className="flex items-start gap-3">
        <MessageCircleQuestion className="mt-0.5 size-5 shrink-0 text-[var(--atlas-amber)]" />
        <p className="text-xs leading-5 text-[var(--atlas-ink-soft)]">{fallbackCopy[reason]}</p>
      </div>
      {reason === "quota" && !quota?.signedIn ? (
        <Link href="/sign-in?next=%2F" className="atlas-secondary-button h-9 shrink-0 px-3 text-xs">Sign in to continue</Link>
      ) : null}
    </aside>
  );
}

export function AssistantAnswer({
  discovery,
  onSelectOrganization,
  onAskSuggestion,
  onStartNewQuestion
}: {
  discovery: AtlasDiscoveryResult;
  onSelectOrganization: (organizationId: string) => void;
  onAskSuggestion: (question: string) => void;
  onStartNewQuestion: () => void;
}) {
  const answer = discovery.assistant;
  const organizations = discovery.organizations ?? [];
  if (!answer) return null;

  const organizationsById = new Map(organizations.map((organization) => [organization.id, organization]));
  const citationsById = citationMap(organizations);
  const outcome = outcomeCopy[answer.outcome];

  return (
    <section className="mt-4 overflow-hidden rounded-[24px] border border-[var(--atlas-border-strong)] bg-white shadow-[var(--atlas-shadow-soft)]" aria-labelledby="ask-true-north-answer" aria-live="polite">
      <div className="grid gap-5 border-b border-[var(--atlas-border)] bg-[var(--atlas-ink)] px-5 py-5 text-white lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--atlas-signal)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--atlas-ink)]"><Sparkles className="size-3" />Ask True North</span>
            <span className="text-[11px] font-semibold text-white/65">{outcome.label}</span>
          </div>
          <h2 id="ask-true-north-answer" className="mt-3 max-w-3xl text-xl font-extrabold tracking-[-0.025em] sm:text-2xl">{answer.interpretedNeed}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">{answer.summary}</p>
          <p className="mt-2 text-[11px] leading-5 text-white/55">{outcome.detail}</p>
        </div>
        <button type="button" onClick={onStartNewQuestion} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/25 px-3 text-xs font-bold text-white hover:border-[var(--atlas-signal)] hover:text-[var(--atlas-signal)]"><RotateCcw className="size-3.5" />Start new question</button>
      </div>

      {answer.matches.length ? (
        <ol className="divide-y divide-[var(--atlas-border)]">
          {answer.matches.map((match, index) => {
            const organization = organizationsById.get(match.organizationId);
            if (!organization) return null;
            const capability = match.capabilityId
              ? organization.capabilities.find((item) => item.id === match.capabilityId) ?? null
              : null;
            const citations = Array.from(new Map(
              match.supportPoints
                .flatMap((point) => point.citationIds)
                .map((id) => citationsById.get(id))
                .filter((citation): citation is AtlasCitation => Boolean(citation))
                .map((citation) => [citation.sourceUrl, citation])
            ).values());

            return (
              <li key={match.organizationId} className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[42px_minmax(0,1fr)_220px]">
                <span className="flex size-9 items-center justify-center rounded-full bg-[var(--atlas-signal)] text-sm font-extrabold text-[var(--atlas-ink)]">{index + 1}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-extrabold text-[var(--atlas-ink)]">{organization.name}</h3>
                    <span className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold",
                      match.fitLevel === "strong" ? "bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]" : match.fitLevel === "plausible" ? "bg-[var(--atlas-violet-soft)] text-[var(--atlas-violet)]" : "bg-[var(--atlas-amber-soft)] text-[var(--atlas-amber)]"
                    )}>{match.fitLevel === "strong" ? "Strong fit" : match.fitLevel === "plausible" ? "Plausible fit" : "Adjacent fit"}</span>
                    <span className="rounded-full bg-[var(--atlas-surface-muted)] px-2.5 py-1 text-[10px] font-bold text-[var(--atlas-muted)]">{match.evidenceLevel[0].toUpperCase() + match.evidenceLevel.slice(1)} evidence</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[var(--atlas-primary)]">{capability?.name ?? "Organization-level fit"}</p>
                  <ul className="mt-3 space-y-2">
                    {match.supportPoints.map((point) => (
                      <li key={`${point.text}-${point.citationIds.join("-")}`} className="flex gap-2 text-xs leading-5 text-[var(--atlas-ink-soft)]"><Check className="mt-0.5 size-4 shrink-0 text-[var(--atlas-primary)]" /><span>{point.text}</span></li>
                    ))}
                  </ul>
                  {match.limitations.length ? (
                    <div className="mt-3 rounded-xl bg-[var(--atlas-surface-muted)] px-3 py-2.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--atlas-muted)]">What remains unverified</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--atlas-ink-soft)]">{match.limitations.join(" ")}</p>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 lg:border-l lg:border-[var(--atlas-border)] lg:pl-4">
                  <button type="button" onClick={() => onSelectOrganization(organization.id)} className="atlas-primary-button h-10 gap-2 px-3 text-xs">Show on map <ArrowRight className="size-3.5" /></button>
                  <Link href={`/organizations/${organization.slug}`} className="atlas-secondary-button h-10 gap-2 px-3 text-xs">Open profile <ExternalLink className="size-3.5" /></Link>
                  <Link href={`/collections?addType=organization&addId=${organization.id}&returnTo=${encodeURIComponent("/")}`} className="atlas-secondary-button h-10 gap-2 px-3 text-xs"><BookmarkPlus className="size-3.5" />Working List</Link>
                  {citations.length ? (
                    <div className="mt-1 border-t border-[var(--atlas-border)] pt-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--atlas-muted)]">Public sources</p>
                      {citations.slice(0, 3).map((citation) => (
                        <a key={citation.sourceUrl} href={citation.sourceUrl} target="_blank" rel="noreferrer" onClick={() => trackBetaEvent("evidence_open", { mode: "assistant", organization: organization.slug })} className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold leading-4 text-[var(--atlas-primary)] no-underline hover:underline"><span className="line-clamp-2">{citation.publisher}: {citation.sourceTitle}</span><ExternalLink className="mt-0.5 size-3 shrink-0" /></a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="px-5 py-6 sm:px-6">
          <div className="flex items-start gap-3 rounded-[18px] bg-[var(--atlas-surface-muted)] p-4">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-[var(--atlas-violet)]" />
            <div><h3 className="text-sm font-extrabold text-[var(--atlas-ink)]">A useful gap to investigate</h3><p className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">True North Map will not manufacture a match when the published evidence is too thin. Suggest a missing organization or source to improve this view.</p></div>
          </div>
        </div>
      )}

      {answer.gaps.length || answer.followUpSuggestions.length ? (
        <div className="grid gap-5 border-t border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)] px-5 py-5 sm:px-6 lg:grid-cols-2">
          <div>
            <h3 className="text-xs font-extrabold text-[var(--atlas-ink)]">What the current records cannot confirm</h3>
            {answer.gaps.length ? <ul className="mt-2 space-y-1 text-xs leading-5 text-[var(--atlas-muted)]">{answer.gaps.map((gap) => <li key={gap}>• {gap}</li>)}</ul> : <p className="mt-2 text-xs text-[var(--atlas-muted)]">No additional coverage gap was identified.</p>}
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-[var(--atlas-ink)]">Refine the question</h3>
            <div className="mt-2 flex flex-wrap gap-2">{answer.followUpSuggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => onAskSuggestion(suggestion)} className="rounded-xl border border-[var(--atlas-border)] bg-white px-3 py-2 text-left text-xs font-semibold text-[var(--atlas-ink-soft)] hover:border-[var(--atlas-primary)]">{suggestion}</button>)}</div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-[var(--atlas-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex max-w-3xl items-start gap-2 text-[11px] leading-5 text-[var(--atlas-muted)]"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--atlas-primary)]" />Our assessment uses reviewed public records. It is not endorsement, eligibility, procurement guidance, or due diligence.</p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => trackBetaEvent("feedback", { mode: "assistant", rating: "helpful", outcome: answer.outcome })} className="atlas-secondary-button h-9 gap-2 px-3 text-xs"><ThumbsUp className="size-3.5" />Helpful</button>
          <button type="button" onClick={openBetaFeedback} className="atlas-secondary-button h-9 px-3 text-xs">Something is missing</button>
        </div>
      </div>
    </section>
  );
}
