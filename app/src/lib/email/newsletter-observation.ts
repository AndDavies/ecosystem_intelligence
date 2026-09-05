import { z } from "zod";

const count = z.number().int().nonnegative().nullable();
const metrics = z.object({sent: count, delivered: count, estimatedUniqueOpens: count, uniqueClicks: count, bounces: count, unsubscribes: count}).strict();
export const newsletterObservationSchema = z.object({
  schemaVersion: z.literal("tnm_newsletter_observation_v1"),
  collectedAt: z.string().datetime(),
  status: z.enum(["available", "partial", "unavailable"]),
  errors: z.array(z.enum(["configuration", "groups", "membership", "preferences", "campaigns", "welcome", "storage", "dashboard"])),
  groups: z.object({master: count, weekly: count, signalAlerts: count}).strict(),
  preferences: z.object({checked: count, verified: count, mismatches: count, changedDuringCheck: count, unrecordedMemberships: count}).strict(),
  welcome: z.object({enabled: z.boolean().nullable(), metrics}).strict(),
  alerts: z.object({status: z.enum(["draft", "ready", "sent", "unknown"])}).strict(),
  campaigns: z.array(z.object({id: z.string().regex(/^\d+$/), stream: z.enum(["weekly", "signal_alerts"]), purpose: z.enum(["production", "verification"]), completedAt: z.string().datetime().nullable(), metrics}).strict()).max(10000)
}).strict();
export type NewsletterObservation = z.infer<typeof newsletterObservationSchema>;
export const emptyNewsletterMetrics = () => ({sent: null, delivered: null, estimatedUniqueOpens: null, uniqueClicks: null, bounces: null, unsubscribes: null});

// Provider filters are OR branches. Every branch must require only the same
// approved delivery group; mixed/legacy/all-subscriber campaigns are excluded.
export function campaignStream(value: unknown, groups: {weekly: string | null; signalAlerts: string | null}) {
  if (!Array.isArray(value) || !value.length) return null;
  const streams = value.map(branch => {
    if (!Array.isArray(branch)) return null;
    const constraints = branch.filter(row => row && row.operator === "in_any" && Array.isArray(row.args) && row.args[0] === "groups");
    if (constraints.length !== 1) return null;
    const ids = constraints[0].args[1];
    if (!Array.isArray(ids) || ids.length !== 1) return null;
    return groups.weekly && String(ids[0]) === groups.weekly ? "weekly" : groups.signalAlerts && String(ids[0]) === groups.signalAlerts ? "signal_alerts" : null;
  });
  return streams.every(stream => stream && stream === streams[0]) ? streams[0] as "weekly" | "signal_alerts" : null;
}

export function campaignPurpose(id: string, name: string) {
  return id === "196945915690353799" || /\b(test|qa|verification|preview)\b/i.test(name) ? "verification" as const : "production" as const;
}
