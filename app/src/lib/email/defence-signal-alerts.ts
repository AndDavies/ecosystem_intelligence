export const defenceSignalAlertSchedule = {
  localTime: "08:00",
  timeZone: "America/Halifax"
} as const;

export type DefenceSignalFeedItem = {
  guid: string;
  url: string;
  slug: string;
  title: string;
  publishedAt: string;
};

export type DefenceSignalAlertContent = DefenceSignalFeedItem & {
  executiveSummary: string;
  topics: string[];
  principalLimit: string | null;
};

export type DefenceSignalAlertBaseline = {
  latestGuid: string | null;
  latestPublishedAt: string | null;
};

export function createDefenceSignalAlertBaseline(items: DefenceSignalFeedItem[]): DefenceSignalAlertBaseline {
  const latest = [...items].sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))[0];
  return { latestGuid: latest?.guid ?? null, latestPublishedAt: latest?.publishedAt ?? null };
}

/**
 * Selects genuinely new editions after the explicit baseline. A correction
 * keeps the stable edition URL/GUID and therefore cannot resend. Missing feed,
 * draft, no-publish, and route failures produce no items before this helper is
 * called and consequently no delivery candidate.
 */
export function selectDefenceSignalAlertCandidates({
  items,
  baseline,
  deliveredGuids
}: {
  items: DefenceSignalFeedItem[];
  baseline: DefenceSignalAlertBaseline;
  deliveredGuids: ReadonlySet<string>;
}) {
  if (!baseline.latestPublishedAt) return [];
  const baselineTime = Date.parse(baseline.latestPublishedAt);
  return items
    .filter((item) => item.guid !== baseline.latestGuid)
    .filter((item) => !deliveredGuids.has(item.guid))
    .filter((item) => Number.isFinite(Date.parse(item.publishedAt)) && Date.parse(item.publishedAt) > baselineTime)
    .sort((left, right) => Date.parse(left.publishedAt) - Date.parse(right.publishedAt));
}

export function defenceSignalEmailUtm(slug: string, ctaSlug: string) {
  const content = `${slug}_${ctaSlug}`.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  return `utm_source=mailerlite&utm_medium=email&utm_campaign=defence_signal_alerts&utm_content=${encodeURIComponent(content)}`;
}

export function defenceSignalAlertTopics(items: Array<{
  title: string;
  links?: Array<{ label: string }>;
}>, maximum = 3) {
  const topics: string[] = [];
  for (const item of items) {
    for (const link of item.links ?? []) {
      const label = link.label.replace(/^(Organization|Capability|Mission Area|Public Need|Technology):\s*/i, "").trim();
      if (label && !topics.some((topic) => topic.toLocaleLowerCase("en-CA") === label.toLocaleLowerCase("en-CA"))) topics.push(label);
      if (topics.length === maximum) return topics;
    }
  }
  for (const item of items) {
    const label = item.title.trim();
    if (label && !topics.some((topic) => topic.toLocaleLowerCase("en-CA") === label.toLocaleLowerCase("en-CA"))) topics.push(label);
    if (topics.length === maximum) break;
  }
  return topics;
}

/**
 * MailerLite's RSS campaign consumes the ordinary item description, so the
 * feed carries the complete compact alert body as source-backed plain text.
 */
export function buildDefenceSignalAlertDescription(content: Pick<DefenceSignalAlertContent, "executiveSummary" | "topics" | "principalLimit">) {
  const topics = content.topics.slice(0, 3).map((topic) => topic.trim()).filter(Boolean);
  return [
    content.executiveSummary.trim(),
    topics.length ? `Topics in this edition: ${topics.join("; ")}.` : null,
    content.principalLimit?.trim() ? `Principal limit: ${content.principalLimit.trim()}` : null
  ].filter((value): value is string => Boolean(value)).join("\n\n");
}
