import { z } from "zod";

/** Omission preserves existing copy; null explicitly clears it in reviewed writes. */
export const presentationTextSchema = z.string().trim().nullable();
const optionalCopy = presentationTextSchema.optional();
export const organizationPresentationCopySchema = z.object({
  displayLead: optionalCopy,
  roleDescriptor: optionalCopy
}).strict();
export const capabilityPresentationCopySchema = z.object({
  displayLead: optionalCopy,
  catalogueTeaser: optionalCopy
}).strict();
export type OrganizationPresentationCopy = z.infer<typeof organizationPresentationCopySchema>;
export type CapabilityPresentationCopy = z.infer<typeof capabilityPresentationCopySchema>;
export const dossierPresentationDraftSchema = z.object({
  organization: organizationPresentationCopySchema,
  capabilities: z.record(capabilityPresentationCopySchema)
}).strict();
export type DossierPresentationDraft = z.infer<typeof dossierPresentationDraftSchema>;

export function reviewedPresentationDraft(value: unknown, capabilityIds: string[], reviewed: boolean) {
  const draft = dossierPresentationDraftSchema.parse(value);
  const ids = new Set(capabilityIds);
  if (!reviewed || Object.keys(draft.capabilities).some(id => !ids.has(id))) {
    throw new Error("Local review or entity mapping is missing.");
  }
  return draft;
}

export function presentationCopyGuidance(copy: OrganizationPresentationCopy & CapabilityPresentationCopy) {
  const guidance: Array<{ field: keyof typeof copy; message: string }> = [];
  for (const [field, lower, upper] of [["displayLead", 35, 65], ["catalogueTeaser", 25, 55], ["roleDescriptor", 3, 10]] as const) {
    const text = copy[field]?.trim();
    if (!text) continue;
    const words = text.split(/\s+/u).length;
    if (words < lower || words > upper) guidance.push({ field, message: `${words} words; normally ${lower}–${upper}. Review for clarity and necessary qualifications; length alone does not prevent use.` });
  }
  return guidance;
}

export function dossierParagraphs(value: string | null | undefined) {
  return (value ?? "").replace(/\r\n?/g, "\n").split(/\n[\t ]*\n+/u).map(paragraph => paragraph.trim()).filter(Boolean);
}
