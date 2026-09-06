import { organizationKindLabel } from "@/lib/atlas/presentation";
import type { AtlasOrganization } from "@/types/atlas";

// Discovery groups do not change the detailed classification on a profile.
const innovationSupportKinds = new Set([
  "accelerator", "incubator", "ecosystem organization", "government innovation office"
]);
export const publicOrganizationTypes = new Set([
  "company", "innovation_support", "research_test_centre", "investor_funder"
]);

const normalize = (value: string) => value.trim().toLowerCase().replaceAll("_", " ");
type OrganizationTypeRecord = Pick<AtlasOrganization, "entityKind" | "categories">;

export function matchesOrganizationType(organization: OrganizationTypeRecord, type?: string) {
  if (!type) return true;
  const values = [organization.entityKind, ...organization.categories].map(normalize);
  if (normalize(type) === "innovation support") return values.some((value) => innovationSupportKinds.has(value));
  // Existing detailed-type and category URLs retain their exact semantics.
  return values.includes(normalize(type));
}

export function organizationTypeFilterLabel(value: string) {
  return normalize(value) === "innovation support" ? "Innovation & business support" : organizationKindLabel(value, true);
}

export function buildOrganizationTypeOptions(organizations: OrganizationTypeRecord[], activeType?: string) {
  const values = new Set(publicOrganizationTypes);
  if (activeType) values.add(activeType);
  return Array.from(values, (value) => ({
    value,
    label: organizationTypeFilterLabel(value),
    count: organizations.filter((organization) => matchesOrganizationType(organization, value)).length
  })).filter((option) => option.count > 0 || option.value === activeType);
}
