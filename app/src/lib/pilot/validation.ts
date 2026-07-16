import { z } from "zod";

const safePath = z.string().trim().min(1).max(500).refine((value) => value.startsWith("/"), {
  message: "Path must be relative to the preview site."
});

const optionalShortText = z.union([z.literal(""), z.string().trim().max(120)]).optional().transform((value) => value || null);
const optionalEmail = z.union([z.literal(""), z.string().trim().email().max(320)]).optional().transform((value) => value ? value.toLowerCase() : null);

export const pilotSignupSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  consent: z.literal(true),
  consentText: z.string().trim().min(20).max(1000),
  consentVersion: z.string().trim().min(1).max(40),
  source: z.string().trim().min(1).max(80).default("pilot_popup"),
  cohort: optionalShortText,
  landingPath: safePath,
  website: z.string().max(200).optional().default("")
});

export const pilotFeedbackSchema = z.object({
  goal: z.string().trim().min(3).max(1200),
  worked: z.union([z.literal(""), z.string().trim().max(2000)]).optional().transform((value) => value || null),
  missing: z.string().trim().min(3).max(3000),
  contactEmail: optionalEmail,
  contextPath: safePath,
  cohort: optionalShortText,
  website: z.string().max(200).optional().default("")
});

export const pilotEventNames = [
  "atlas_search",
  "filter_apply",
  "marker_select",
  "dossier_open",
  "evidence_open",
  "export",
  "signup",
  "feedback"
] as const;

export type PilotEventName = (typeof pilotEventNames)[number];

const pilotMetadataValue = z.union([z.string().max(255), z.number().finite(), z.boolean(), z.null()]);

export const pilotEventSchema = z.object({
  eventName: z.enum(pilotEventNames),
  contextPath: safePath,
  cohort: optionalShortText,
  metadata: z.record(z.string().max(80), pilotMetadataValue)
    .refine((value) => Object.keys(value).length <= 8, "Too many event properties.")
    .default({})
});

