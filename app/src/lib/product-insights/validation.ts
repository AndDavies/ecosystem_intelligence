import { z } from "zod";

// PostgreSQL text cannot store NUL; reject it before any workflow or provider call.
// eslint-disable-next-line no-control-regex
const databaseText = () => z.string().regex(/^[^\u0000]*$/u, "Text cannot contain a null character.");

const safePath = databaseText().trim().min(1).max(500).regex(/^\/[^?#]*$/, {
  message: "Path must be queryless and relative to True North Map."
});

const optionalShortText = z.union([z.literal(""), databaseText().trim().max(120)]).nullish().transform((value) => value || null);
const optionalEmail = z.union([z.literal(""), databaseText().trim().email().max(320)]).optional().transform((value) => value ? value.toLowerCase() : null);
const optionalUuid = z.union([z.literal(""), databaseText().uuid()]).nullish().transform((value) => value || null);

export const northSignalConsentText = "By subscribing, you agree to receive the free weekly North Signal email from True North Map. Unsubscribe anytime.";
export const northSignalConsentVersion = "north-signal-weekly-2026-08-v1";
export const defenceSignalAlertsConsentText = "Also email me when a new Defence Signal is published. I can change this preference or unsubscribe anytime.";
export const defenceSignalAlertsConsentVersion = "defence-signal-alerts-2026-08-v1";
export const northSignalSignupSources = [
  "newsletter_header",
  "newsletter_footer",
  "newsletter_modal_desktop",
  "newsletter_banner_mobile",
  "newsletter_inline_home",
  "newsletter_inline_map",
  "newsletter_inline_brief",
  "newsletter_inline_profile",
  "newsletter_page",
  "newsletter_inline_signals",
  "newsletter_inline_mission",
  "newsletter_inline_demand"
] as const;

export type NorthSignalSignupSource = (typeof northSignalSignupSources)[number];

export const betaSignupSchema = z.object({
  email: databaseText().trim().email().max(320).transform((value) => value.toLowerCase()),
  consent: z.literal(true),
  consentText: z.literal(northSignalConsentText),
  consentVersion: z.literal(northSignalConsentVersion),
  signalAlerts: z.boolean().optional().default(false),
  alertsConsentText: z.literal(defenceSignalAlertsConsentText).optional(),
  alertsConsentVersion: z.literal(defenceSignalAlertsConsentVersion).optional(),
  source: z.enum(northSignalSignupSources),
  cohort: optionalShortText,
  deviceClass: z.enum(["mobile", "tablet", "desktop", "unknown"]).optional().default("unknown"),
  contentType: optionalShortText,
  utmSource: optionalShortText,
  utmMedium: optionalShortText,
  utmCampaign: optionalShortText,
  utmContent: optionalShortText,
  sessionId: optionalUuid,
  searchId: optionalUuid,
  successEventId: databaseText().uuid(),
  occurredAt: databaseText().datetime({ offset: true }),
  landingPath: safePath,
  captchaToken: databaseText().trim().max(4096).optional().default(""),
  website: databaseText().max(200).optional().default("")
}).superRefine((value, context) => {
  if (!value.signalAlerts) return;
  if (value.alertsConsentText !== defenceSignalAlertsConsentText) {
    context.addIssue({ code: "custom", path: ["alertsConsentText"], message: "Alert consent text is required." });
  }
  if (value.alertsConsentVersion !== defenceSignalAlertsConsentVersion) {
    context.addIssue({ code: "custom", path: ["alertsConsentVersion"], message: "Alert consent version is required." });
  }
});

export const betaFeedbackSchema = z.object({
  goal: databaseText().trim().min(3).max(1200),
  worked: z.union([z.literal(""), databaseText().trim().max(2000)]).optional().transform((value) => value || null),
  missing: databaseText().trim().min(3).max(3000),
  contactEmail: optionalEmail,
  contextPath: safePath,
  cohort: optionalShortText,
  sessionId: optionalUuid,
  searchId: optionalUuid,
  captchaToken: databaseText().trim().max(4096).optional().default(""),
  website: databaseText().max(200).optional().default("")
});

export const betaDiscoveryRequestSchema = z.object({
  query: databaseText().trim().min(1).max(500),
  contextPath: safePath.optional().default("/"),
  cohort: optionalShortText,
  sessionId: optionalUuid,
  priorTurns: z.array(z.object({
    query: databaseText().trim().min(1).max(500),
    organizationIds: z.array(databaseText().trim().min(1).max(120)).max(5)
  })).max(3).optional().default([])
});

export const betaEventNames = [
  "atlas_search",
  "filter_apply",
  "marker_select",
  "result_select",
  "dossier_open",
  "evidence_open",
  "export",
  "save",
  "submission",
  "connection",
  "subscription",
  "newsletter_impression",
  "newsletter_open",
  "newsletter_cta_click",
  "newsletter_form_start",
  "newsletter_submit",
  "newsletter_landing_view",
  "newsletter_sample_open",
  "newsletter_success",
  "newsletter_error",
  "newsletter_dismiss",
  "feedback",
  "share",
  "profile_engagement"
] as const;

export type BetaEventName = (typeof betaEventNames)[number];

const pilotMetadataValue = z.union([databaseText().max(255), z.number().finite(), z.boolean(), z.null()]);

export const entryChannels = [
  "direct",
  "organic_google",
  "organic_other",
  "email",
  "founder_social",
  "company_social",
  "earned_partner",
  "referral",
  "authentication_service",
  "internal",
  "unknown"
] as const;

const optionalUtm = z.union([
  z.literal(""),
  databaseText().trim().max(120).regex(/^[a-z0-9][a-z0-9_-]*$/i)
]).nullish().transform((value) => value || null);

export const profileEngagementActions = [
  "section_nav",
  "depth_60",
  "mission_open",
  "public_need_open",
  "program_source_open",
  "related_intelligence_open",
  "map_open"
] as const;

export type ProfileEngagementAction = (typeof profileEngagementActions)[number];

const betaEventBaseSchema = z.object({
  eventId: databaseText().uuid(),
  eventName: z.enum(betaEventNames),
  contextPath: safePath,
  occurredAt: databaseText().datetime({ offset: true }),
  cohort: optionalShortText,
  entryChannel: z.enum(entryChannels).optional().default("unknown"),
  utmSource: optionalUtm,
  utmMedium: optionalUtm,
  utmCampaign: optionalUtm,
  utmContent: optionalUtm,
  sessionId: optionalUuid,
  searchId: optionalUuid,
  metadata: z.record(databaseText().max(80), pilotMetadataValue)
    .refine((value) => Object.keys(value).length <= 8, "Too many event properties.")
    .default({})
});

export const betaEventSchema = betaEventBaseSchema.superRefine((event, context) => {
  const commonNewsletterKeys = ["placement", "trigger", "variant", "device_class", "content_type", "landing_path"];
  const allowedByEvent: Record<BetaEventName, readonly string[]> = {
    atlas_search: ["filter_count", "result_count", "mode", "outcome", "zero_result"],
    filter_apply: ["filter", "value", "placement", "measurement_version"],
    marker_select: ["organization", "source"],
    result_select: ["organization", "source", "presentation", "target", "position_band", "destination", "placement", "measurement_version"],
    dossier_open: ["slug"],
    evidence_open: ["mode", "organization", "destination_host"],
    export: ["type"],
    save: ["type"],
    submission: ["type"],
    connection: ["organization_id"],
    subscription: ["placement"],
    newsletter_impression: commonNewsletterKeys,
    newsletter_open: commonNewsletterKeys,
    newsletter_cta_click: ["placement", "source_path", "destination_path"],
    newsletter_form_start: commonNewsletterKeys,
    newsletter_submit: commonNewsletterKeys,
    newsletter_landing_view: ["placement", "content_type", "device_class"],
    newsletter_sample_open: [...commonNewsletterKeys, "sample_path", "measurement_version"],
    newsletter_success: commonNewsletterKeys,
    newsletter_error: [...commonNewsletterKeys, "error_class"],
    newsletter_dismiss: commonNewsletterKeys,
    feedback: ["mode", "rating", "outcome"],
    share: ["method", "content_title"],
    profile_engagement: ["action", "organization_id", "target_id", "target_type", "section", "template_version", "release_source"]
  };
  const allowedKeys = new Set(allowedByEvent[event.eventName]);
  if (event.eventName === "profile_engagement") {
    const action = event.metadata.action;
    if (typeof action !== "string" || !profileEngagementActions.includes(action as ProfileEngagementAction)) {
      context.addIssue({ code: "custom", path: ["metadata", "action"], message: "Profile engagement requires an enumerated action." });
    }
  }
  for (const key of Object.keys(event.metadata)) {
    if (!allowedKeys.has(key)) {
      context.addIssue({ code: "custom", path: ["metadata", key], message: "Event metadata is not on the bounded allowlist." });
      continue;
    }
    if (/query|referrer|email/i.test(key)) {
      context.addIssue({ code: "custom", path: ["metadata", key], message: "Queries, referrers, and personal information are prohibited." });
    }
    const value = event.metadata[key];
    if (typeof value === "string" && /(?:^|\s)[^\s@]+@[^\s@]+\.[^\s@]+/.test(value)) {
      context.addIssue({ code: "custom", path: ["metadata", key], message: "Personal information is prohibited." });
    }
    if (typeof value === "string" && key.endsWith("_path") && !/^\/[^?#]*$/.test(value)) {
      context.addIssue({ code: "custom", path: ["metadata", key], message: "Event paths must be queryless relative paths." });
    }
  }
});
