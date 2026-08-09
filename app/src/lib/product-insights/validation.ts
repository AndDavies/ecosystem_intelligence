import { z } from "zod";

const safePath = z.string().trim().min(1).max(500).refine((value) => value.startsWith("/"), {
  message: "Path must be relative to the public beta site."
});

const optionalShortText = z.union([z.literal(""), z.string().trim().max(120)]).nullish().transform((value) => value || null);
const optionalEmail = z.union([z.literal(""), z.string().trim().email().max(320)]).optional().transform((value) => value ? value.toLowerCase() : null);
const optionalUuid = z.union([z.literal(""), z.string().uuid()]).nullish().transform((value) => value || null);

export const northSignalConsentText = "By subscribing, you agree to receive the weekly North Signal email from True North Map. Unsubscribe anytime.";
export const northSignalConsentVersion = "north-signal-2026-07-v2";
export const northSignalSignupSources = [
  "newsletter_header",
  "newsletter_footer",
  "newsletter_modal_desktop",
  "newsletter_banner_mobile",
  "newsletter_inline_home",
  "newsletter_inline_map",
  "newsletter_inline_brief",
  "newsletter_inline_profile"
] as const;

export type NorthSignalSignupSource = (typeof northSignalSignupSources)[number];

export const betaSignupSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  consent: z.literal(true),
  consentText: z.literal(northSignalConsentText),
  consentVersion: z.literal(northSignalConsentVersion),
  source: z.enum(northSignalSignupSources),
  cohort: optionalShortText,
  sessionId: optionalUuid,
  searchId: optionalUuid,
  landingPath: safePath,
  captchaToken: z.string().trim().max(4096).optional().default(""),
  website: z.string().max(200).optional().default("")
});

export const betaFeedbackSchema = z.object({
  goal: z.string().trim().min(3).max(1200),
  worked: z.union([z.literal(""), z.string().trim().max(2000)]).optional().transform((value) => value || null),
  missing: z.string().trim().min(3).max(3000),
  contactEmail: optionalEmail,
  contextPath: safePath,
  cohort: optionalShortText,
  sessionId: optionalUuid,
  searchId: optionalUuid,
  captchaToken: z.string().trim().max(4096).optional().default(""),
  website: z.string().max(200).optional().default("")
});

export const betaDiscoveryRequestSchema = z.object({
  query: z.string().trim().min(1).max(500),
  contextPath: safePath.optional().default("/"),
  cohort: optionalShortText,
  sessionId: optionalUuid,
  priorTurns: z.array(z.object({
    query: z.string().trim().min(1).max(500),
    organizationIds: z.array(z.string().trim().min(1).max(120)).max(5)
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
  "newsletter_form_start",
  "newsletter_submit",
  "newsletter_error",
  "newsletter_dismiss",
  "feedback",
  "share",
  "profile_engagement"
] as const;

export type BetaEventName = (typeof betaEventNames)[number];

const pilotMetadataValue = z.union([z.string().max(255), z.number().finite(), z.boolean(), z.null()]);

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
  eventName: z.enum(betaEventNames),
  contextPath: safePath,
  cohort: optionalShortText,
  sessionId: optionalUuid,
  searchId: optionalUuid,
  metadata: z.record(z.string().max(80), pilotMetadataValue)
    .refine((value) => Object.keys(value).length <= 8, "Too many event properties.")
    .default({})
});

export const betaEventSchema = betaEventBaseSchema.superRefine((event, context) => {
  if (event.eventName !== "profile_engagement") return;
  const allowedKeys = new Set(["action", "organization_id", "target_id", "target_type", "section", "template_version", "release_source"]);
  const action = event.metadata.action;
  if (typeof action !== "string" || !profileEngagementActions.includes(action as ProfileEngagementAction)) {
    context.addIssue({ code: "custom", path: ["metadata", "action"], message: "Profile engagement requires an enumerated action." });
  }
  for (const key of Object.keys(event.metadata)) {
    if (!allowedKeys.has(key)) {
      context.addIssue({ code: "custom", path: ["metadata", key], message: "Profile engagement metadata is not on the bounded allowlist." });
    }
  }
});
