import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Building2, CircleHelp, ExternalLink, Trash2, Upload } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PendingButton } from "@/components/ui/pending-button";
import {
  editPublishedOrganization,
  editPublishedOrganizationContact,
  editPublishedOrganizationDossierChild,
  editPublishedOrganizationEditorialProfile,
  removePublishedOrganizationLogo,
  replacePublishedOrganizationLogo
} from "@/lib/actions/atlas-organizations";
import { requireAtlasStaff } from "@/lib/atlas/auth";
import { organizationLogoUrl } from "@/lib/atlas/organization-logos";
import { publicContactFromProfileData } from "@/lib/atlas/presentation";
import { createClient } from "@/lib/supabase/server";

type RawLocation = {
  id: string;
  city: string | null;
  province_territory: string | null;
  latitude: number | null;
  longitude: number | null;
  geographic_confidence: string;
  is_primary: boolean;
};

type RawCapability = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  capability_type: string | null;
  core_features: string[];
  technology_readiness_level: number | null;
  maturity: string | null;
  commercial_availability: string | null;
  defence_applications: string[];
  novelty: string[];
  technical_tags: string[];
  source_confidence: string;
};

type RawDomainLink = {
  capability_id: string;
  is_primary: boolean;
  technical_domain: { id: string; slug: string; name: string };
};

type RawCitation = {
  citation: { entity_type: string; entity_id: string; field_name: string };
  evidence: { excerpt: string };
  source: { title: string; canonical_url: string | null; publisher: string };
};

type RawReviewedQuestion = {
  id: string;
  question: string;
  context: string;
  confidence: "high" | "moderate";
};

type RawProgramParticipation = {
  id: string;
  participation_type: string;
  cohort_label: string | null;
  public_summary: string | null;
  lifecycle_stage: string | null;
  announced_on: string | null;
  started_on: string | null;
  ended_on: string | null;
  external_identifiers: Array<{ kind: string; value: string }>;
  program: { id: string; name: string; program_type: string; summary?: string | null };
};

type RawFundingEvent = {
  id: string;
  event_type: string;
  announced_on: string | null;
  amount_value: number | null;
  amount_currency: string | null;
  disclosed_summary: string;
};

type RawRelationship = {
  id: string;
  relationship_type: string;
  public_summary: string;
  related_organization_name: string | null;
  related_organization?: { name?: string | null } | null;
};

type DossierRow = {
  id: string;
  slug: string;
  name: string;
  legal_name: string | null;
  description: string;
  website_url: string | null;
  entity_kind: string;
  organization_categories: string[];
  founded_year: number | null;
  employee_range: string | null;
  company_stage: string | null;
  ownership: string | null;
  commercial_status: string | null;
  disclosed_financing_summary: string | null;
  defence_posture: string | null;
  dual_use_posture: string | null;
  source_confidence: string;
  freshness_status: string;
  profile_data: Record<string, unknown>;
  editorial_profile_version: string | null;
  current_activity: string | null;
  current_activity_as_of: string | null;
  operating_context: string | null;
  canadian_footprint: string | null;
  reviewed_questions: RawReviewedQuestion[];
  locations: RawLocation[];
  capabilities: RawCapability[];
  capability_domains: RawDomainLink[];
  programs: RawProgramParticipation[];
  funding_events: RawFundingEvent[];
  relationships: RawRelationship[];
  citations: RawCitation[];
};

type RawLogo = {
  id: string;
  storage_path: string;
  source_url: string | null;
  permission_basis: string | null;
  attribution_text: string | null;
  created_at: string;
};

const entityKinds = [
  ["company", "Company"],
  ["accelerator", "Accelerator"],
  ["incubator", "Incubator"],
  ["research_test_centre", "Research or test centre"],
  ["investor_funder", "Investor or funder"],
  ["ecosystem_organization", "Ecosystem organization"],
  ["government_innovation_office", "Government innovation office"]
] as const;

const errorMessages: Record<string, string> = {
  "invalid-edit": "Some required fields are missing or invalid. Check the highlighted section values and try again.",
  "update-failed": "The public record was not changed. Refresh the page and verify that its location, technology, and classification values still exist.",
  "invalid-contact": "Check the contact fields. Public links must use HTTPS, the email must be valid, and an editorial rationale is required.",
  "contact-update-failed": "The public contact details were not changed. Refresh the page and try again.",
  "invalid-editorial-profile": "Check the dossier narrative, current-activity date, curated questions, and editorial rationale.",
  "editorial-profile-read-failed": "The current dossier activation state could not be verified, so no change was made.",
  "activation-requires-reviewed-publish": "First activation of the executive dossier must come through a validated research candidate, human Review, and the separate Publish checkpoint.",
  "editorial-profile-update-failed": "The dossier narrative was not changed. New wording requires existing public citations; materially new claims belong in Review.",
  "invalid-dossier-child": "Check the program, funding, or relationship fields and provide an editorial rationale.",
  "dossier-child-update-failed": "The dossier record was not changed. Wording corrections require the cited record to remain supported.",
  "invalid-logo": "Choose a JPEG, PNG, or WebP logo under 10 MB and provide its official HTTPS source links.",
  "logo-update-failed": "The organization logo was not changed. Refresh the page and try again.",
  "logo-remove-failed": "The organization logo could not be removed. Refresh the page and try again."
};

const successMessages: Record<string, string> = {
  "contact-updated": "Public contact details updated.",
  "editorial-profile-updated": "Cited dossier narrative updated and the public profile refreshed.",
  "dossier-child-updated": "Cited public-record wording updated and the public profile refreshed.",
  "logo-updated": "Organization logo updated and the public profile refreshed.",
  "logo-removed": "Organization logo removed and the neutral profile mark restored."
};

export default async function EditPublishedOrganizationPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ capability?: string; error?: string; success?: string }>;
}) {
  await requireAtlasStaff("editor");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_dossiers")
    .select("*")
    .eq("id", id)
    .eq("publication_status", "published")
    .maybeSingle();
  if (!data) notFound();

  const dossier = data as unknown as DossierRow;
  const capabilities = dossier.capabilities ?? [];
  const capability = capabilities.find((item) => item.id === query.capability) ?? capabilities[0];
  const location = (dossier.locations ?? []).find((item) => item.is_primary) ?? dossier.locations?.[0];

  const [{ data: domains }, { data: clusters }, { data: clusterLinks }, { data: logos }] = await Promise.all([
    supabase.from("technical_domains").select("id, slug, name, summary").eq("publication_status", "published").order("name"),
    supabase.from("ecosystem_clusters").select("id, slug, name, summary, region_slug").eq("publication_status", "published").order("name"),
    supabase.from("capability_clusters").select("ecosystem_cluster_id").eq("capability_id", capability?.id ?? "00000000-0000-0000-0000-000000000000").eq("publication_status", "published"),
    supabase
      .from("media_assets")
      .select("id, storage_path, source_url, permission_basis, attribution_text, created_at")
      .eq("organization_id", dossier.id)
      .eq("asset_type", "logo")
      .eq("approval_status", "approved")
      .eq("publication_status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
  ]);
  const currentLogo = (logos?.[0] as RawLogo | undefined) ?? null;
  const domainLinks = (dossier.capability_domains ?? []).filter((link) => link.capability_id === capability?.id);
  const primaryDomain = domainLinks.find((link) => link.is_primary)?.technical_domain ?? domainLinks[0]?.technical_domain;
  const additionalDomainSlugs = new Set(domainLinks.filter((link) => !link.is_primary).map((link) => link.technical_domain.slug));
  const selectedClusterId = clusterLinks?.[0]?.ecosystem_cluster_id ?? "";
  const selectedCluster = clusters?.find((cluster) => cluster.id === selectedClusterId);
  const selectedDomain = domains?.find((domain) => domain.slug === primaryDomain?.slug);
  const publicContact = publicContactFromProfileData(dossier.profile_data ?? {});
  const citation = dossier.citations?.find((item) => item.citation.entity_type === "organization" && item.citation.entity_id === dossier.id)
    ?? dossier.citations?.find((item) => item.citation.entity_type === "capability" && item.citation.entity_id === capability?.id);

  const fieldClass = "form-control";
  const areaClass = "form-control h-auto py-3 leading-6";

  return (
    <PublicPageShell variant="admin" eyebrow="Published record maintenance" title={`Edit ${dossier.name}`} description="Update the information people use to understand this organization and decide whether to engage. Stable profile links are preserved and every change is recorded." backHref="/admin/organizations" backLabel="Published organizations" actions={<Link href={`/organizations/${dossier.slug}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--admin-border)] bg-white px-3 text-xs font-semibold text-[var(--admin-ink-soft)] no-underline">View public profile <ExternalLink className="size-3.5" /></Link>}>
      <AdminNav />
      {query.error ? <div className="mb-5 rounded-md border border-[var(--admin-danger-border)] bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">{errorMessages[query.error] ?? "The organization could not be updated."}</div> : null}
      {query.success ? <div className="mb-5 rounded-md border border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] px-3 py-2 text-sm text-[var(--admin-success)]">{successMessages[query.success] ?? "Published record updated and public map refreshed."}</div> : null}

      {capabilities.length > 1 ? (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-white p-3">
          <span className="mr-1 text-xs font-semibold text-[var(--admin-muted)]">Technology or offering being edited:</span>
          {capabilities.map((item) => <Link key={item.id} href={`/admin/organizations/${dossier.id}/edit?capability=${item.id}`} className={`rounded-md px-3 py-2 text-xs font-semibold no-underline ${item.id === capability.id ? "bg-[var(--admin-action)] text-white" : "bg-[var(--admin-surface-subtle)] text-[var(--admin-ink-soft)]"}`}>{item.name}</Link>)}
        </div>
      ) : null}

      <PublicCard title="Organization logo" eyebrow="Public profile identity">
        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[#c9ccca] p-4">
              {currentLogo ? (
                <Image src={organizationLogoUrl(currentLogo.storage_path)} alt={`${dossier.name} logo`} fill sizes="220px" className="object-contain p-4" />
              ) : (
                <Building2 className="size-10 text-[var(--admin-muted)]" aria-hidden="true" />
              )}
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--admin-muted)]">{currentLogo ? "Approved logo shown on the public organization profile." : "No approved logo is published. The public profile uses a neutral organization mark."}</p>
            {currentLogo?.source_url ? <a href={currentLogo.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--admin-action)]">Open official logo asset <ExternalLink className="size-3" /></a> : null}
            {currentLogo?.attribution_text ? <p className="mt-1 text-xs text-[var(--admin-muted)]">Attribution: {currentLogo.attribution_text}</p> : null}
            {currentLogo?.permission_basis ? <details className="mt-2 text-xs text-[var(--admin-muted)]"><summary className="cursor-pointer font-semibold">Source provenance</summary><p className="mt-1 leading-5">{currentLogo.permission_basis}</p></details> : null}
          </div>

          <div>
            <form action={replacePublishedOrganizationLogo}>
              <input type="hidden" name="organizationId" value={dossier.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <EditField label="Logo file" help="Upload an official JPEG, PNG, or WebP under 10 MB. The system normalizes it to a transparent WebP within 1024 by 512 pixels."><input name="logoFile" type="file" accept="image/jpeg,image/png,image/webp" required className={fieldClass} /></EditField>
                <EditField label="Source confidence" help="High is an unambiguous official mark. Medium is acceptable only after you have reviewed the source manually."><select name="confidence" defaultValue="high" className={fieldClass}><option value="high">High</option><option value="medium">Medium</option></select></EditField>
                <EditField label="Official source page" help="The organization page where the mark was found."><input name="sourcePageUrl" type="url" pattern="https://.*" required defaultValue={dossier.website_url ?? ""} className={fieldClass} /></EditField>
                <EditField label="Official logo asset URL" help="The direct image URL from the official website."><input name="sourceAssetUrl" type="url" pattern="https://.*" required defaultValue={currentLogo?.source_url ?? ""} className={fieldClass} /></EditField>
              </div>
              <EditField label="Attribution (optional)" className="mt-4"><input name="attributionText" maxLength={500} defaultValue={currentLogo?.attribution_text ?? `${dossier.name} official logo`} className={fieldClass} /></EditField>
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <PendingButton type="submit" pendingLabel="Publishing logo…" className="h-11 bg-[var(--admin-action)] px-5 text-sm font-semibold text-white hover:bg-[var(--admin-action-hover)]"><Upload className="mr-2 size-4" />Replace logo</PendingButton>
              </div>
            </form>
            {currentLogo ? (
              <form action={removePublishedOrganizationLogo} className="mt-3 flex justify-end border-t border-[var(--admin-border)] pt-3">
                <input type="hidden" name="organizationId" value={dossier.id} />
                <PendingButton type="submit" pendingLabel="Removing logo…" className="h-10 border border-[var(--admin-danger-border)] bg-white px-4 text-xs font-semibold text-[var(--admin-danger)] hover:bg-[var(--admin-danger-soft)]"><Trash2 className="mr-2 size-4" />Remove logo</PendingButton>
              </form>
            ) : null}
          </div>
        </div>
      </PublicCard>

      <form action={editPublishedOrganizationContact} className="mb-5">
        <input type="hidden" name="organizationId" value={dossier.id} />
        <PublicCard title="Public contact" eyebrow="Help people take the next step">
          <p className="mb-4 max-w-3xl text-xs leading-5 text-[var(--admin-muted)]">Add only official contact paths supported by a public source. Leave private contacts and unknown fields blank; visitors can still request an introduction through True North Map.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <EditField label="Official contact page" help="Use the organization’s public contact or business-development page, not a personal profile."><input name="contactPageUrl" type="url" pattern="https://.*" defaultValue={publicContact.contactPageUrl ?? ""} className={fieldClass} placeholder="https://example.ca/contact" /></EditField>
            <EditField label="Public email" help="Use an email the organization publishes for general, partnerships, sales, or business-development contact."><input name="publicEmail" type="email" defaultValue={publicContact.publicEmail ?? ""} className={fieldClass} placeholder="partnerships@example.ca" /></EditField>
            <EditField label="Public phone" help="Use an organization-level phone number from an official source."><input name="publicPhone" maxLength={80} defaultValue={publicContact.publicPhone ?? ""} className={fieldClass} placeholder="+1 902 555 0100" /></EditField>
            <EditField label="LinkedIn page" help="Use the organization’s official LinkedIn page, not an individual’s profile."><input name="linkedInUrl" type="url" pattern="https://.*" defaultValue={publicContact.linkedInUrl ?? ""} className={fieldClass} placeholder="https://www.linkedin.com/company/example" /></EditField>
          </div>
          <EditField label="Why this contact is safe to publish" className="mt-4" help="Record the official source and why the details are appropriate for public use."><textarea name="contactRationale" required minLength={3} maxLength={2000} rows={3} className={areaClass} placeholder="Official contact page reviewed on…" /></EditField>
          <div className="mt-4 flex justify-end"><PendingButton type="submit" pendingLabel="Saving contact…" className="h-11 bg-[var(--admin-action)] px-5 text-sm font-semibold text-white hover:bg-[var(--admin-action-hover)]">Save public contact</PendingButton></div>
        </PublicCard>
      </form>

      <EditorialProfileEditor dossier={dossier} />
      <DossierRecordMaintenance dossier={dossier} />

      {capability && location ? <form action={editPublishedOrganization} className="space-y-5">
        <input type="hidden" name="organizationId" value={dossier.id} />
        <input type="hidden" name="locationId" value={location.id} />
        <input type="hidden" name="capabilityId" value={capability.id} />

        <PublicCard title="Organization identity" eyebrow="Canonical public profile">
          <div className="grid gap-4 md:grid-cols-2">
            <EditField label="Public name"><input name="name" required maxLength={200} defaultValue={dossier.name} className={fieldClass} /></EditField>
            <EditField label="Legal name (optional)"><input name="legalName" maxLength={240} defaultValue={dossier.legal_name ?? ""} className={fieldClass} /></EditField>
          </div>
          <EditField label="Description" className="mt-4"><textarea name="description" required minLength={40} maxLength={4000} rows={5} defaultValue={dossier.description} className={areaClass} /></EditField>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <EditField label="Website"><input name="websiteUrl" type="url" pattern="https://.*" defaultValue={dossier.website_url ?? ""} className={fieldClass} /></EditField>
            <EditField label="Organization type"><select name="entityKind" defaultValue={dossier.entity_kind} className={fieldClass}>{entityKinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></EditField>
          </div>
          <EditField label="Categories" className="mt-4"><textarea name="categories" required rows={3} defaultValue={(dossier.organization_categories ?? []).join("\n")} className={areaClass} /><FieldHint>One category per line. These remain internal taxonomy labels.</FieldHint></EditField>
        </PublicCard>

        <PublicCard title="Primary location" eyebrow="Map and regional discovery">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <EditField label="City"><input name="city" required defaultValue={location.city ?? ""} className={fieldClass} /></EditField>
            <EditField label="Province or territory"><input name="provinceTerritory" required defaultValue={location.province_territory ?? ""} className={fieldClass} /></EditField>
            <EditField label="Latitude"><input name="latitude" type="number" step="any" min="41" max="84" required defaultValue={location.latitude ?? ""} className={fieldClass} /></EditField>
            <EditField label="Longitude"><input name="longitude" type="number" step="any" min="-142" max="-52" required defaultValue={location.longitude ?? ""} className={fieldClass} /></EditField>
            <EditField label="Map accuracy"><select name="geographicConfidence" defaultValue={location.geographic_confidence} className={fieldClass}><option value="exact">Exact</option><option value="city_centroid">City centre</option><option value="regional">Regional only</option><option value="unverified">Unverified</option></select></EditField>
          </div>
        </PublicCard>

        <PublicCard title={capability.name} eyebrow="Published technology or offering">
          <div className="grid gap-4 md:grid-cols-2">
            <EditField label="Technology or offering name"><input name="capabilityName" required maxLength={240} defaultValue={capability.name} className={fieldClass} /></EditField>
            <EditField label="Type" help="A plain-language category such as platform, vehicle, sensor, software, service, program, or facility."><input name="capabilityType" maxLength={240} defaultValue={capability.capability_type ?? ""} className={fieldClass} /></EditField>
          </div>
          <EditField label="What it does" className="mt-4" help="Describe the concrete problem this technology or offering helps a customer solve. Keep source-backed facts separate from analysis."><textarea name="capabilitySummary" required minLength={40} maxLength={4000} rows={5} defaultValue={capability.summary} className={areaClass} /></EditField>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <EditField label="Core features"><textarea name="features" rows={5} defaultValue={(capability.core_features ?? []).join("\n")} className={areaClass} /><FieldHint>One item per line.</FieldHint></EditField>
            <EditField label="Defence and security uses"><textarea name="applications" rows={5} defaultValue={(capability.defence_applications ?? []).join("\n")} className={areaClass} /><FieldHint>One item per line.</FieldHint></EditField>
            <EditField label="Technical tags"><textarea name="tags" rows={5} defaultValue={(capability.technical_tags ?? []).join("\n")} className={areaClass} /><FieldHint>One item per line.</FieldHint></EditField>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <EditField label="Main technology area" help="Choose the broad technology landscape people are most likely to use when looking for this offering."><select name="technicalDomainSlug" required defaultValue={primaryDomain?.slug ?? ""} className={fieldClass}><option value="" disabled>Select an area</option>{domains?.map((domain) => <option key={domain.id} value={domain.slug}>{domain.name}</option>)}</select>{selectedDomain?.summary ? <FieldHint>{selectedDomain.summary}</FieldHint> : null}</EditField>
            <EditField label="Regional ecosystem group" help="Use this when the offering belongs to an established regional concentration or initiative. It is not the organization’s location."><select name="clusterSlug" defaultValue={selectedCluster?.slug ?? ""} className={fieldClass}><option value="">No regional group</option>{clusters?.map((cluster) => <option key={cluster.id} value={cluster.slug}>{cluster.name}{cluster.region_slug ? ` · ${cluster.region_slug.replaceAll("-", " ")}` : ""}</option>)}</select>{selectedCluster?.summary ? <FieldHint>{selectedCluster.summary}</FieldHint> : null}</EditField>
            <EditField label="Technology source support" help="High means the important public claims are well supported; Moderate means usable but incomplete; Needs review keeps the gap visible."><select name="capabilityConfidence" defaultValue={capability.source_confidence} className={fieldClass}><option value="high">High</option><option value="moderate">Moderate</option><option value="needs_review">Needs review</option></select></EditField>
          </div>
          <fieldset className="mt-4 rounded-md border border-[var(--admin-border)] p-4">
            <legend className="px-1 text-xs font-semibold text-[var(--admin-ink-soft)]">Other technology areas</legend>
            <FieldHint>Select only areas that materially improve how people find this offering.</FieldHint>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{domains?.map((domain) => <label key={domain.id} className="flex items-center gap-2 text-xs text-[var(--admin-muted-strong)]"><input type="checkbox" name="additionalDomainSlug" value={domain.slug} defaultChecked={additionalDomainSlugs.has(domain.slug)} className="size-4 accent-[var(--admin-action)]" />{domain.name}</label>)}</div>
          </fieldset>
          <details className="mt-4 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--admin-ink-soft)]">Maturity and novelty details</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <EditField label="Technology readiness level"><input name="technologyReadinessLevel" type="number" min="1" max="9" defaultValue={capability.technology_readiness_level ?? ""} className={fieldClass} /></EditField>
              <EditField label="Maturity"><input name="maturity" maxLength={240} defaultValue={capability.maturity ?? ""} className={fieldClass} /></EditField>
              <EditField label="Commercial availability"><input name="commercialAvailability" maxLength={500} defaultValue={capability.commercial_availability ?? ""} className={fieldClass} /></EditField>
            </div>
            <EditField label="Novelty" className="mt-4"><textarea name="novelty" rows={3} defaultValue={(capability.novelty ?? []).join("\n")} className={areaClass} /><FieldHint>One item per line.</FieldHint></EditField>
          </details>
        </PublicCard>

        <PublicCard title="Business profile" eyebrow="Optional dossier depth">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <EditField label="Founded year"><input name="foundedYear" type="number" min="1800" max="2100" defaultValue={dossier.founded_year ?? ""} className={fieldClass} /></EditField>
            <EditField label="Employee range"><input name="employeeRange" maxLength={120} defaultValue={dossier.employee_range ?? ""} className={fieldClass} /></EditField>
            <EditField label="Company stage"><input name="companyStage" maxLength={120} defaultValue={dossier.company_stage ?? ""} className={fieldClass} /></EditField>
            <EditField label="Ownership"><input name="ownership" maxLength={240} defaultValue={dossier.ownership ?? ""} className={fieldClass} /></EditField>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <EditField label="Commercial status"><textarea name="commercialStatus" rows={3} defaultValue={dossier.commercial_status ?? ""} className={areaClass} /></EditField>
            <EditField label="Disclosed financing summary"><textarea name="disclosedFinancingSummary" rows={3} defaultValue={dossier.disclosed_financing_summary ?? ""} className={areaClass} /></EditField>
            <EditField label="Defence posture"><textarea name="defencePosture" rows={3} defaultValue={dossier.defence_posture ?? ""} className={areaClass} /></EditField>
            <EditField label="Dual-use posture"><textarea name="dualUsePosture" rows={3} defaultValue={dossier.dual_use_posture ?? ""} className={areaClass} /></EditField>
          </div>
        </PublicCard>

        <PublicCard title="Editorial decision" eyebrow="Immediate public change">
          <div className="flex items-start gap-3 rounded-md border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] p-3 text-xs leading-5 text-[var(--admin-warning)]"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>Save only source-supported changes. This editor preserves existing citations; source replacement and new evidence still belong in the review workflow.</span></div>
          {citation ? <a href={citation.source.canonical_url ?? "#"} target={citation.source.canonical_url ? "_blank" : undefined} rel="noreferrer" className="mt-4 block rounded-md border border-[var(--admin-evidence-border)] bg-[var(--admin-evidence-soft)] p-4 no-underline"><span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-evidence)]">Current supporting source</span><strong className="mt-1 block text-sm text-[var(--admin-ink)]">{citation.source.title}</strong><span className="mt-1 block text-xs leading-5 text-[var(--admin-muted)]">{citation.source.publisher} · {citation.evidence.excerpt}</span></a> : null}
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <EditField label="Profile source support" help="Rate how well the organization-level facts are supported by current public evidence."><select name="organizationConfidence" defaultValue={dossier.source_confidence} className={fieldClass}><option value="high">High</option><option value="moderate">Moderate</option><option value="needs_review">Needs review</option></select></EditField>
            <EditField label="Review status" help="Current records have recently reviewed sources. Review due and Stale keep aging evidence visible to editors."><select name="freshnessStatus" defaultValue={dossier.freshness_status} className={fieldClass}><option value="current">Current</option><option value="review_due">Review due</option><option value="stale">Stale</option></select></EditField>
            <EditField label="Change rationale"><textarea name="rationale" required minLength={3} maxLength={2000} rows={3} className={areaClass} placeholder="What changed, why, and which public evidence supports it" /></EditField>
          </div>
          <div className="mt-5 flex justify-end"><PendingButton type="submit" pendingLabel="Saving public record…" className="h-11 bg-[var(--admin-action)] px-5 text-sm font-semibold text-white hover:bg-[var(--admin-action-hover)]">Save published record</PendingButton></div>
        </PublicCard>
      </form> : (
        <EmptyCoverage
          title="Capability and location maintenance is unavailable"
          detail="Narrative, public contact, logo, program, funding, and relationship maintenance remain available above. Add a missing linked capability or primary location through the reviewed research workflow before using the combined taxonomy and map editor."
        />
      )}
    </PublicPageShell>
  );
}

function EditorialProfileEditor({ dossier }: { dossier: DossierRow }) {
  const fieldClass = "form-control";
  const areaClass = "form-control h-auto py-3 leading-6";
  const reviewedQuestions = dossier.reviewed_questions ?? [];
  return (
    <form action={editPublishedOrganizationEditorialProfile} className="mb-5">
      <input type="hidden" name="organizationId" value={dossier.id} />
      <PublicCard title="Executive dossier narrative" eyebrow="Cited editorial profile">
        <div className="mb-4 flex items-start gap-3 rounded-md border border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] p-3 text-xs leading-5 text-[var(--admin-warning)]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>This editor corrects wording only where public citations are already attached. Route new claims, new questions, and new evidence through Research, Admin Review, and Publish.</span>
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <EditField label="Why this organization matters now" help="A current, source-supported development or decision context. Pair it with an explicit as-of date.">
            <textarea name="currentActivity" maxLength={4000} rows={5} defaultValue={dossier.current_activity ?? ""} className={areaClass} />
          </EditField>
          <div className="grid content-start gap-4">
            <EditField label="Current activity as of"><input name="currentActivityAsOf" type="date" defaultValue={dossier.current_activity_as_of ?? ""} className={fieldClass} /></EditField>
            <EditField label="Dossier presentation" help="Activate only after the full profile has been assessed and every published claim remains cited.">
              {dossier.editorial_profile_version === "organization_editorial_profile_v1" ? <select name="editorialProfileVersion" defaultValue={dossier.editorial_profile_version} className={fieldClass}>
                <option value="">Legacy public profile</option>
                <option value="organization_editorial_profile_v1">Executive dossier v1</option>
              </select> : <><input type="hidden" name="editorialProfileVersion" value="" /><p className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-3 py-2.5 text-xs leading-5 text-[var(--admin-muted-strong)]">Legacy public profile. First activation is available only through a reviewed research candidate and the separate Publish checkpoint.</p></>}
            </EditField>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <EditField label="Operating context" help="Business-readable context about customers, delivery model, maturity, or ecosystem position that is already supported by attached evidence.">
            <textarea name="operatingContext" maxLength={2000} rows={5} defaultValue={dossier.operating_context ?? ""} className={areaClass} />
          </EditField>
          <EditField label="Canadian footprint" help="Source-supported Canadian facilities, operations, people, partnerships, or delivery presence. Do not infer a street-level location.">
            <textarea name="canadianFootprint" maxLength={2000} rows={5} defaultValue={dossier.canadian_footprint ?? ""} className={areaClass} />
          </EditField>
        </div>

        <div className="mt-5 border-t border-[var(--admin-border)] pt-5">
          <h3 className="text-sm font-semibold text-[var(--admin-ink)]">Questions for a first conversation</h3>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--admin-muted)]">Only curated, evidence-contextual questions are public. This editor can correct existing questions; create a new question through a reviewed research candidate so its context citation is attached.</p>
          {reviewedQuestions.length ? (
            <div className="mt-4 space-y-4">
              {reviewedQuestions.map((question, index) => (
                <fieldset key={question.id} className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
                  <legend className="px-1 text-xs font-semibold text-[var(--admin-ink-soft)]">Question {index + 1}</legend>
                  <input type="hidden" name="questionId" value={question.id} />
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px]">
                    <EditField label="Question"><input name="question" required minLength={20} maxLength={280} defaultValue={question.question} className={fieldClass} /></EditField>
                    <EditField label="Evidence confidence"><select name="questionConfidence" defaultValue={question.confidence} className={fieldClass}><option value="high">High</option><option value="moderate">Moderate</option></select></EditField>
                  </div>
                  <EditField label="Why ask it" className="mt-4"><textarea name="questionContext" required minLength={40} maxLength={500} rows={3} defaultValue={question.context} className={areaClass} /></EditField>
                </fieldset>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-md border border-dashed border-[var(--admin-border)] px-4 py-3 text-xs text-[var(--admin-muted)]">No curated public questions are attached. The dossier will omit this section cleanly.</p>
          )}
        </div>

        <EditField label="Editorial rationale" className="mt-5" help="Record what wording changed, why the existing citation still supports it, and whether the dossier version changed.">
          <textarea name="editorialRationale" required minLength={3} maxLength={2000} rows={3} className={areaClass} placeholder="Corrected wording against the existing cited source…" />
        </EditField>
        <div className="mt-4 flex justify-end"><PendingButton type="submit" pendingLabel="Saving dossier narrative…" className="h-11 bg-[var(--admin-action)] px-5 text-sm font-semibold text-white hover:bg-[var(--admin-action-hover)]">Save dossier narrative</PendingButton></div>
      </PublicCard>
    </form>
  );
}

function DossierRecordMaintenance({ dossier }: { dossier: DossierRow }) {
  const programs = dossier.programs ?? [];
  const fundingEvents = dossier.funding_events ?? [];
  const relationships = dossier.relationships ?? [];
  if (!programs.length && !fundingEvents.length && !relationships.length) {
    return (
      <PublicCard title="Programs, funding, and relationships" eyebrow="Reviewed public record" className="mb-5">
        <p className="text-sm leading-6 text-[var(--admin-muted-strong)]">No published child records are available to correct. Add material programs, funding events, or relationships through a research candidate; this maintenance surface never creates uncited records.</p>
      </PublicCard>
    );
  }
  return (
    <div className="mb-5 space-y-5">
      {programs.length ? (
        <PublicCard title="Contracts, programs, and deployments" eyebrow="Existing cited participation">
          <p className="mb-4 text-xs leading-5 text-[var(--admin-muted)]">Correct the organization’s role and lifecycle only when the attached participation citations still support the wording. Canonical program facts remain separate.</p>
          <div className="space-y-3">
            {programs.map((participation) => (
              <details key={participation.id} className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
                <summary className="cursor-pointer text-sm font-semibold text-[var(--admin-ink)]">{participation.program?.name ?? "Published program"} · {participation.participation_type}</summary>
                <ProgramParticipationForm organizationId={dossier.id} participation={participation} />
              </details>
            ))}
          </div>
        </PublicCard>
      ) : null}
      {fundingEvents.length ? (
        <PublicCard title="Funding and ownership events" eyebrow="Existing cited public record">
          <div className="space-y-3">{fundingEvents.map((event) => <details key={event.id} className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4"><summary className="cursor-pointer text-sm font-semibold text-[var(--admin-ink)]">{event.event_type} · {event.announced_on ?? "Date not published"}</summary><FundingEventForm organizationId={dossier.id} event={event} /></details>)}</div>
        </PublicCard>
      ) : null}
      {relationships.length ? (
        <PublicCard title="Ecosystem relationships" eyebrow="Existing cited public record">
          <div className="space-y-3">{relationships.map((relationship) => <details key={relationship.id} className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4"><summary className="cursor-pointer text-sm font-semibold text-[var(--admin-ink)]">{relationship.related_organization?.name ?? relationship.related_organization_name ?? "Named ecosystem relationship"} · {relationship.relationship_type}</summary><RelationshipForm organizationId={dossier.id} relationship={relationship} /></details>)}</div>
        </PublicCard>
      ) : null}
    </div>
  );
}

function ProgramParticipationForm({ organizationId, participation }: { organizationId: string; participation: RawProgramParticipation }) {
  const fieldClass = "form-control";
  const areaClass = "form-control h-auto py-3 leading-6";
  return (
    <form action={editPublishedOrganizationDossierChild} className="mt-4 border-t border-[var(--admin-border)] pt-4">
      <input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="entityId" value={participation.id} /><input type="hidden" name="entityType" value="program_participation" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <EditField label="Organization role"><input name="participationType" required maxLength={240} defaultValue={participation.participation_type} className={fieldClass} /></EditField>
        <EditField label="Cohort or lot"><input name="cohortLabel" maxLength={240} defaultValue={participation.cohort_label ?? ""} className={fieldClass} /></EditField>
        <EditField label="Lifecycle stage"><select name="lifecycleStage" defaultValue={participation.lifecycle_stage ?? ""} className={fieldClass}><option value="">Not published</option>{["announced", "selected", "funded", "awarded", "contracted", "testing", "evaluating", "delivering", "operational", "completed", "cancelled"].map((stage) => <option key={stage} value={stage}>{stage.replaceAll("_", " ")}</option>)}</select></EditField>
        <EditField label="Announcement date"><input name="announcedOn" type="date" defaultValue={participation.announced_on ?? ""} className={fieldClass} /></EditField>
        <EditField label="Start date"><input name="startedOn" type="date" defaultValue={participation.started_on ?? ""} className={fieldClass} /></EditField>
        <EditField label="End date"><input name="endedOn" type="date" defaultValue={participation.ended_on ?? ""} className={fieldClass} /></EditField>
      </div>
      <EditField label="Organization-specific public summary" className="mt-4"><textarea name="publicSummary" maxLength={2000} rows={4} defaultValue={participation.public_summary ?? ""} className={areaClass} /></EditField>
      <EditField label="External identifiers" className="mt-4" help="Up to 10, one per line as kind:value (160 characters maximum per value). Allowed kinds are contract, notice, challenge, project, award, and other."><textarea name="externalIdentifiers" rows={3} defaultValue={(participation.external_identifiers ?? []).map((item) => `${item.kind}:${item.value}`).join("\n")} className={areaClass} /></EditField>
      <ChildEditorialDecision />
    </form>
  );
}

function FundingEventForm({ organizationId, event }: { organizationId: string; event: RawFundingEvent }) {
  const fieldClass = "form-control";
  const areaClass = "form-control h-auto py-3 leading-6";
  return (
    <form action={editPublishedOrganizationDossierChild} className="mt-4 border-t border-[var(--admin-border)] pt-4">
      <input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="entityId" value={event.id} /><input type="hidden" name="entityType" value="funding_event" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <EditField label="Event type"><input name="eventType" required maxLength={240} defaultValue={event.event_type} className={fieldClass} /></EditField>
        <EditField label="Announcement date"><input name="announcedOn" type="date" defaultValue={event.announced_on ?? ""} className={fieldClass} /></EditField>
        <EditField label="Disclosed amount"><input name="amountValue" type="number" min="0" step="any" defaultValue={event.amount_value ?? ""} className={fieldClass} /></EditField>
        <EditField label="Currency"><input name="amountCurrency" pattern="[A-Za-z]{3}" maxLength={3} defaultValue={event.amount_currency ?? ""} className={fieldClass} /></EditField>
      </div>
      <EditField label="Public summary" className="mt-4"><textarea name="disclosedSummary" required maxLength={3000} rows={4} defaultValue={event.disclosed_summary} className={areaClass} /></EditField>
      <ChildEditorialDecision />
    </form>
  );
}

function RelationshipForm({ organizationId, relationship }: { organizationId: string; relationship: RawRelationship }) {
  const fieldClass = "form-control";
  const areaClass = "form-control h-auto py-3 leading-6";
  return (
    <form action={editPublishedOrganizationDossierChild} className="mt-4 border-t border-[var(--admin-border)] pt-4">
      <input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="entityId" value={relationship.id} /><input type="hidden" name="entityType" value="organization_relationship" />
      <EditField label="Relationship type"><input name="relationshipType" required maxLength={240} defaultValue={relationship.relationship_type} className={fieldClass} /></EditField>
      <EditField label="Public summary" className="mt-4"><textarea name="publicSummary" required maxLength={3000} rows={4} defaultValue={relationship.public_summary} className={areaClass} /></EditField>
      <ChildEditorialDecision />
    </form>
  );
}

function ChildEditorialDecision() {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <EditField label="Editorial rationale" help="Explain the wording correction and why the existing attached evidence still supports it."><textarea name="childRationale" required minLength={3} maxLength={2000} rows={3} className="form-control h-auto py-3 leading-6" /></EditField>
      <PendingButton type="submit" pendingLabel="Saving cited record…" className="h-11 bg-[var(--admin-action)] px-5 text-sm font-semibold text-white hover:bg-[var(--admin-action-hover)]">Save cited record</PendingButton>
    </div>
  );
}

function EditField({ label, children, className = "", help }: { label: string; children: React.ReactNode; className?: string; help?: string }) {
  return (
    <div className={className}>
      <label className="grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]">{label}{children}</label>
      {help ? (
        <details className="group relative mt-1.5 w-fit text-[10px] font-normal text-[var(--admin-muted)]">
          <summary className="flex cursor-pointer list-none items-center gap-1 font-semibold text-[var(--admin-muted-strong)] hover:text-[var(--admin-action)]"><CircleHelp className="size-3.5" /> What belongs here?</summary>
          <p className="relative z-10 mt-1 max-w-md rounded-md border border-[var(--admin-border)] bg-white p-2.5 text-xs font-normal leading-5 text-[var(--admin-muted-strong)] shadow-sm">{help}</p>
        </details>
      ) : null}
    </div>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-normal text-[var(--admin-muted)]">{children}</span>;
}
