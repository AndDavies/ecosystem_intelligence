"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { splitCandidateList } from "@/lib/atlas/candidate-schema";
import { createClient } from "@/lib/supabase/server";

const optionalText = (maximum: number) => z.string().trim().max(maximum).transform((value) => value || null);
const optionalInteger = (minimum: number, maximum: number) => z.preprocess(
  (value) => String(value ?? "").trim() === "" ? null : Number(value),
  z.number().int().min(minimum).max(maximum).nullable()
);

const publishedOrganizationEditSchema = z.object({
  organizationId: z.string().uuid(),
  locationId: z.string().uuid(),
  capabilityId: z.string().uuid(),
  rationale: z.string().trim().min(3).max(2000),
  name: z.string().trim().min(1).max(200),
  legalName: optionalText(240),
  description: z.string().trim().min(40).max(4000),
  websiteUrl: z.union([z.literal(""), z.string().url().startsWith("https://")]),
  entityKind: z.enum(["company", "accelerator", "incubator", "research_test_centre", "investor_funder", "ecosystem_organization", "government_innovation_office"]),
  categories: z.string().trim().min(1).max(2000),
  foundedYear: optionalInteger(1800, 2100),
  employeeRange: optionalText(120),
  companyStage: optionalText(120),
  ownership: optionalText(240),
  commercialStatus: optionalText(240),
  disclosedFinancingSummary: optionalText(2000),
  defencePosture: optionalText(2000),
  dualUsePosture: optionalText(2000),
  organizationConfidence: z.enum(["high", "moderate", "needs_review"]),
  freshnessStatus: z.enum(["current", "review_due", "stale"]),
  city: z.string().trim().min(1).max(160),
  provinceTerritory: z.string().trim().min(1).max(160),
  latitude: z.coerce.number().min(41).max(84),
  longitude: z.coerce.number().min(-142).max(-52),
  geographicConfidence: z.enum(["exact", "city_centroid", "regional", "unverified"]),
  capabilityName: z.string().trim().min(1).max(240),
  capabilitySummary: z.string().trim().min(40).max(4000),
  capabilityType: optionalText(240),
  technologyReadinessLevel: optionalInteger(1, 9),
  maturity: optionalText(240),
  commercialAvailability: optionalText(500),
  capabilityConfidence: z.enum(["high", "moderate", "needs_review"]),
  technicalDomainSlug: z.string().trim().min(1).max(240),
  clusterSlug: optionalText(240)
});

const publishedOrganizationContactSchema = z.object({
  organizationId: z.string().uuid(),
  contactPageUrl: z.union([z.literal(""), z.string().url().startsWith("https://")]),
  publicEmail: z.union([z.literal(""), z.string().email()]),
  publicPhone: z.string().trim().max(80),
  linkedInUrl: z.union([z.literal(""), z.string().url().startsWith("https://")]),
  rationale: z.string().trim().min(3).max(2000)
});

export async function editPublishedOrganizationContact(formData: FormData) {
  const user = await requireAtlasStaff("editor");
  const rawOrganizationId = String(formData.get("organizationId") ?? "");
  const safeOrganizationId = z.string().uuid().safeParse(rawOrganizationId);
  const returnPath = safeOrganizationId.success
    ? `/admin/organizations/${safeOrganizationId.data}/edit`
    : "/admin/organizations";
  const parsed = publishedOrganizationContactSchema.safeParse({
    organizationId: rawOrganizationId,
    contactPageUrl: String(formData.get("contactPageUrl") ?? "").trim(),
    publicEmail: String(formData.get("publicEmail") ?? "").trim(),
    publicPhone: String(formData.get("publicPhone") ?? "").trim(),
    linkedInUrl: String(formData.get("linkedInUrl") ?? "").trim(),
    rationale: String(formData.get("contactRationale") ?? "")
  });
  if (!parsed.success) redirect(`${returnPath}?error=invalid-contact`);

  const publicContact = {
    contactPageUrl: parsed.data.contactPageUrl || null,
    publicEmail: parsed.data.publicEmail || null,
    publicPhone: parsed.data.publicPhone || null,
    linkedInUrl: parsed.data.linkedInUrl || null
  };
  const supabase = await createClient({ writeCookies: true });
  const { data: organizationSlug, error } = await supabase.rpc("update_published_organization_public_contact", {
    p_organization_id: parsed.data.organizationId,
    p_reviewer_id: user.id,
    p_public_contact: publicContact,
    p_rationale: parsed.data.rationale
  });
  if (error || typeof organizationSlug !== "string") redirect(`${returnPath}?error=contact-update-failed`);

  revalidateTag("atlas-public");
  revalidatePath("/");
  revalidatePath("/organizations");
  revalidatePath(`/organizations/${organizationSlug}`);
  revalidatePath(returnPath);
  redirect(`${returnPath}?success=contact-updated`);
}

export async function editPublishedOrganization(formData: FormData) {
  const user = await requireAtlasStaff("editor");
  const rawOrganizationId = String(formData.get("organizationId") ?? "");
  const safeOrganizationId = z.string().uuid().safeParse(rawOrganizationId);
  const returnPath = safeOrganizationId.success
    ? `/admin/organizations/${safeOrganizationId.data}/edit`
    : "/admin/organizations";
  const parsed = publishedOrganizationEditSchema.safeParse({
    organizationId: rawOrganizationId,
    locationId: String(formData.get("locationId") ?? ""),
    capabilityId: String(formData.get("capabilityId") ?? ""),
    rationale: String(formData.get("rationale") ?? ""),
    name: String(formData.get("name") ?? ""),
    legalName: String(formData.get("legalName") ?? ""),
    description: String(formData.get("description") ?? ""),
    websiteUrl: String(formData.get("websiteUrl") ?? ""),
    entityKind: String(formData.get("entityKind") ?? ""),
    categories: String(formData.get("categories") ?? ""),
    foundedYear: formData.get("foundedYear"),
    employeeRange: String(formData.get("employeeRange") ?? ""),
    companyStage: String(formData.get("companyStage") ?? ""),
    ownership: String(formData.get("ownership") ?? ""),
    commercialStatus: String(formData.get("commercialStatus") ?? ""),
    disclosedFinancingSummary: String(formData.get("disclosedFinancingSummary") ?? ""),
    defencePosture: String(formData.get("defencePosture") ?? ""),
    dualUsePosture: String(formData.get("dualUsePosture") ?? ""),
    organizationConfidence: String(formData.get("organizationConfidence") ?? ""),
    freshnessStatus: String(formData.get("freshnessStatus") ?? ""),
    city: String(formData.get("city") ?? ""),
    provinceTerritory: String(formData.get("provinceTerritory") ?? ""),
    latitude: String(formData.get("latitude") ?? ""),
    longitude: String(formData.get("longitude") ?? ""),
    geographicConfidence: String(formData.get("geographicConfidence") ?? ""),
    capabilityName: String(formData.get("capabilityName") ?? ""),
    capabilitySummary: String(formData.get("capabilitySummary") ?? ""),
    capabilityType: String(formData.get("capabilityType") ?? ""),
    technologyReadinessLevel: formData.get("technologyReadinessLevel"),
    maturity: String(formData.get("maturity") ?? ""),
    commercialAvailability: String(formData.get("commercialAvailability") ?? ""),
    capabilityConfidence: String(formData.get("capabilityConfidence") ?? ""),
    technicalDomainSlug: String(formData.get("technicalDomainSlug") ?? ""),
    clusterSlug: String(formData.get("clusterSlug") ?? "")
  });
  if (!parsed.success) redirect(`${returnPath}?error=invalid-edit`);

  const categories = splitCandidateList(parsed.data.categories);
  if (!categories.length) redirect(`${returnPath}?error=invalid-edit`);
  const additionalDomains = formData.getAll("additionalDomainSlug").map(String);
  const domainSlugs = [parsed.data.technicalDomainSlug, ...additionalDomains.filter((slug) => slug !== parsed.data.technicalDomainSlug)];
  const payload = {
    organization: {
      name: parsed.data.name,
      legalName: parsed.data.legalName,
      description: parsed.data.description,
      websiteUrl: parsed.data.websiteUrl || null,
      entityKind: parsed.data.entityKind,
      categories,
      foundedYear: parsed.data.foundedYear,
      employeeRange: parsed.data.employeeRange,
      companyStage: parsed.data.companyStage,
      ownership: parsed.data.ownership,
      commercialStatus: parsed.data.commercialStatus,
      disclosedFinancingSummary: parsed.data.disclosedFinancingSummary,
      defencePosture: parsed.data.defencePosture,
      dualUsePosture: parsed.data.dualUsePosture,
      sourceConfidence: parsed.data.organizationConfidence,
      freshnessStatus: parsed.data.freshnessStatus
    },
    location: {
      city: parsed.data.city,
      provinceTerritory: parsed.data.provinceTerritory,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      geographicConfidence: parsed.data.geographicConfidence
    },
    capability: {
      name: parsed.data.capabilityName,
      summary: parsed.data.capabilitySummary,
      capabilityType: parsed.data.capabilityType,
      features: splitCandidateList(formData.get("features")),
      technologyReadinessLevel: parsed.data.technologyReadinessLevel,
      maturity: parsed.data.maturity,
      commercialAvailability: parsed.data.commercialAvailability,
      applications: splitCandidateList(formData.get("applications")),
      novelty: splitCandidateList(formData.get("novelty")),
      tags: splitCandidateList(formData.get("tags")),
      sourceConfidence: parsed.data.capabilityConfidence,
      domainSlugs,
      clusterSlug: parsed.data.clusterSlug
    }
  };

  const supabase = await createClient({ writeCookies: true });
  const { data: organizationSlug, error } = await supabase.rpc("update_published_organization_dossier", {
    p_organization_id: parsed.data.organizationId,
    p_location_id: parsed.data.locationId,
    p_capability_id: parsed.data.capabilityId,
    p_reviewer_id: user.id,
    p_payload: payload,
    p_rationale: parsed.data.rationale
  });
  if (error || typeof organizationSlug !== "string") redirect(`${returnPath}?error=update-failed`);

  revalidateTag("atlas-public");
  revalidatePath("/");
  revalidatePath("/organizations");
  revalidatePath(`/organizations/${organizationSlug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/organizations");
  revalidatePath(returnPath);
  redirect(`${returnPath}?success=updated&capability=${parsed.data.capabilityId}`);
}
