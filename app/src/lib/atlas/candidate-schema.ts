import { z } from "zod";
import {
  demandSignalBundleV1Schema,
  demandRefreshBundleV1Schema,
  organizationRefreshBundleV1Schema,
  organizationBundleV2Schema,
  type DemandSignalBundleV1,
  type DemandRefreshBundleV1,
  type OrganizationRefreshBundleV1,
  type OrganizationBundleV2
} from "@/lib/research/pipeline-schema";
export { demandMatchCandidateSchema, type DemandMatchCandidate } from "@/lib/atlas/demand-matching";
import { demandMatchCandidateSchema } from "@/lib/atlas/demand-matching";

const missionMatchSchema = z.object({
  missionAreaSlug: z.string().trim().min(1),
  alignmentSummary: z.string().trim().min(40),
  confidence: z.enum(["high", "moderate"])
});

export const atlasOrganizationCandidateSchema = z.object({
  schemaVersion: z.literal("organization_bundle_v1"),
  batchId: z.string().trim().min(1),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(40).max(4000),
  websiteUrl: z.string().url().startsWith("https://"),
  city: z.string().trim().min(1).max(160),
  provinceTerritory: z.string().trim().min(1).max(160),
  latitude: z.number().min(41).max(84),
  longitude: z.number().min(-142).max(-52),
  confidence: z.enum(["high", "moderate"]),
  capability: z.object({
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().trim().min(1).max(240),
    summary: z.string().trim().min(40).max(4000),
    type: z.string().trim().min(1).max(240),
    features: z.array(z.string().trim().min(1).max(500)).min(1),
    applications: z.array(z.string().trim().min(1).max(500)).min(1),
    tags: z.array(z.string().trim().min(1).max(120)).min(1),
    technicalDomainSlug: z.string().trim().min(1),
    additionalTechnicalDomainSlugs: z.array(z.string().trim().min(1)).default([]),
    clusterSlug: z.string().trim().min(1).nullable().optional(),
    missionMatches: z.array(missionMatchSchema).default([])
  }),
  source: z.object({
    title: z.string().trim().min(1).max(500),
    url: z.string().url().startsWith("https://"),
    publisher: z.string().trim().min(1).max(240),
    type: z.string().trim().min(1).max(120),
    excerpt: z.string().trim().min(30).max(4000)
  })
});

export type AtlasOrganizationCandidate = z.infer<typeof atlasOrganizationCandidateSchema>;
export type ReviewableOrganizationCandidate = AtlasOrganizationCandidate | OrganizationBundleV2;
export type ReviewableDemandSignalCandidate = DemandSignalBundleV1;
export type ReviewableRefreshCandidate = OrganizationRefreshBundleV1 | DemandRefreshBundleV1;

export function parseAtlasOrganizationCandidate(value: unknown) {
  return atlasOrganizationCandidateSchema.safeParse(value);
}

export function parseOrganizationBundleV2(value: unknown) {
  return organizationBundleV2Schema.safeParse(value);
}

export function parseDemandSignalCandidate(value: unknown) {
  return demandSignalBundleV1Schema.safeParse(value);
}

export function parseOrganizationRefreshCandidate(value: unknown) {
  return organizationRefreshBundleV1Schema.safeParse(value);
}

export function parseDemandRefreshCandidate(value: unknown) {
  return demandRefreshBundleV1Schema.safeParse(value);
}

export function parseDemandMatchCandidate(value: unknown) {
  return demandMatchCandidateSchema.safeParse(value);
}

export function parseReviewableOrganizationCandidate(value: unknown) {
  const legacy = parseAtlasOrganizationCandidate(value);
  if (legacy.success) return { version: "v1" as const, data: legacy.data };
  const typed = parseOrganizationBundleV2(value);
  if (typed.success) return { version: "v2" as const, data: typed.data };
  return null;
}

export function splitCandidateList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}
