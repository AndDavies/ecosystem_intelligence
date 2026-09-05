import type { DailySignalsPacket } from "@/lib/signals/contract";

const hedgePattern = /\b(may|might|could|potentially|relevance)\b/gi;
const audienceLabelPattern = /\b(for )?(business development teams?|ecosystem analysts?|ecosystem organizations?|strategy teams?)\b/gi;
const decisionVerbPattern = /\b(decide|choose|compare|map|watch|track|verify|inspect|confirm|read|open|test|follow|qualify|identify)\b/i;

function paragraphs(value: string) {
  return value.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0;
}

export function getSignalsEditorialIssues(packet: DailySignalsPacket) {
  // V3 uses editorial judgment. Historical packet checks remain unchanged for repairs.
  if (packet.schemaVersion === "daily_signals_packet_v3") return [];
  const issues: string[] = [];
  const editionParagraphs = paragraphs(packet.executiveSummary);

  if (editionParagraphs.length !== 3) issues.push("Edition executive summary must use three short paragraphs: movement, meaning, and boundary.");
  if (/\b(daily|roundup|update)\b/i.test(packet.title)) issues.push("Edition title must describe movement and consequence, not a generic update.");
  if (countMatches(packet.executiveSummary, hedgePattern) > 3) issues.push("Edition executive summary uses too many hedging terms.");

  const openingPhrases = new Map<string, number>();
  for (const item of packet.items) {
    const itemParagraphs = paragraphs(item.executiveSummary);
    const itemWords = words(item.executiveSummary);
    const opening = item.executiveSummary.toLocaleLowerCase("en-CA").split(/\s+/).slice(0, 4).join(" ");
    openingPhrases.set(opening, (openingPhrases.get(opening) ?? 0) + 1);

    if (itemParagraphs.length < 2 || itemParagraphs.length > 3) issues.push(`${item.slug}: executive read must use two or three short paragraphs.`);
    if (itemWords < 80 || itemWords > 180) issues.push(`${item.slug}: executive read must be 80-180 words; received ${itemWords}.`);
    if (countMatches(item.executiveSummary, hedgePattern) > 3) issues.push(`${item.slug}: executive read uses too many hedging terms.`);
    if (countMatches(item.executiveSummary, audienceLabelPattern) > 1) issues.push(`${item.slug}: serve the reader directly instead of repeatedly naming the audience.`);
    if (!decisionVerbPattern.test(item.nextStep)) issues.push(`${item.slug}: practical next step must contain a concrete decision or watch verb.`);
    if (/\bmay matter because\b/i.test(item.automatedRead)) issues.push(`${item.slug}: assessment must lead with a direct consequence rather than generic relevance language.`);
  }

  for (const [opening, count] of openingPhrases) {
    if (count > 1) issues.push(`Repeated executive-read opening detected: "${opening}".`);
  }

  return issues;
}

export function assertSignalsEditorialVoice(packet: DailySignalsPacket) {
  const issues = getSignalsEditorialIssues(packet);
  if (issues.length) throw new Error(`Signals editorial voice check failed:\n- ${issues.join("\n- ")}`);
}
