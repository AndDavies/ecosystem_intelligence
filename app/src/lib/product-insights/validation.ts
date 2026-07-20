import { z } from "zod";

const safePath = z.string().trim().min(1).max(500).refine((value) => value.startsWith("/"), {
  message: "Path must be relative to the public beta site."
});

const optionalShortText = z.union([z.literal(""), z.string().trim().max(120)]).nullish().transform((value) => value || null);
const optionalEmail = z.union([z.literal(""), z.string().trim().email().max(320)]).optional().transform((value) => value ? value.toLowerCase() : null);
const optionalUuid = z.union([z.literal(""), z.string().uuid()]).nullish().transform((value) => value || null);

export const betaSignupSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  consent: z.literal(true),
  consentText: z.string().trim().min(20).max(1000),
  consentVersion: z.string().trim().min(1).max(40),
  source: z.string().trim().min(1).max(80).default("pilot_popup"),
  cohort: optionalShortText,
  sessionId: optionalUuid,
  searchId: optionalUuid,
  landingPath: safePath,
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
  "feedback"
] as const;

export type BetaEventName = (typeof betaEventNames)[number];

const pilotMetadataValue = z.union([z.string().max(255), z.number().finite(), z.boolean(), z.null()]);

export const betaEventSchema = z.object({
  eventName: z.enum(betaEventNames),
  contextPath: safePath,
  cohort: optionalShortText,
  sessionId: optionalUuid,
  searchId: optionalUuid,
  metadata: z.record(z.string().max(80), pilotMetadataValue)
    .refine((value) => Object.keys(value).length <= 8, "Too many event properties.")
    .default({})
});
