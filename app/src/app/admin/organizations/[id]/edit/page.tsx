import Link from "next/link";
import { AlertTriangle, CircleHelp, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/atlas/admin-nav";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { PendingButton } from "@/components/ui/pending-button";
import { editPublishedOrganization, editPublishedOrganizationContact } from "@/lib/actions/atlas-admin";
import { requireAtlasStaff } from "@/lib/atlas/auth";
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
  locations: RawLocation[];
  capabilities: RawCapability[];
  capability_domains: RawDomainLink[];
  citations: RawCitation[];
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
  "contact-update-failed": "The public contact details were not changed. Refresh the page and try again."
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
  if (!capability || !location) {
    return (
      <PublicPageShell eyebrow="Published record maintenance" title={dossier.name} description="This record cannot use the unified editor until it has a published capability and primary location." backHref="/admin/organizations" backLabel="Published organizations">
        <AdminNav />
        <EmptyCoverage title="Canonical record is incomplete" detail="Add the missing linked location or capability through the database review workflow, then return to this editor." />
      </PublicPageShell>
    );
  }

  const [{ data: domains }, { data: clusters }, { data: clusterLinks }] = await Promise.all([
    supabase.from("technical_domains").select("id, slug, name, summary").eq("publication_status", "published").order("name"),
    supabase.from("ecosystem_clusters").select("id, slug, name, summary, region_slug").eq("publication_status", "published").order("name"),
    supabase.from("capability_clusters").select("ecosystem_cluster_id").eq("capability_id", capability.id).eq("publication_status", "published")
  ]);
  const domainLinks = (dossier.capability_domains ?? []).filter((link) => link.capability_id === capability.id);
  const primaryDomain = domainLinks.find((link) => link.is_primary)?.technical_domain ?? domainLinks[0]?.technical_domain;
  const additionalDomainSlugs = new Set(domainLinks.filter((link) => !link.is_primary).map((link) => link.technical_domain.slug));
  const selectedClusterId = clusterLinks?.[0]?.ecosystem_cluster_id ?? "";
  const selectedCluster = clusters?.find((cluster) => cluster.id === selectedClusterId);
  const selectedDomain = domains?.find((domain) => domain.slug === primaryDomain?.slug);
  const publicContact = publicContactFromProfileData(dossier.profile_data ?? {});
  const citation = dossier.citations?.find((item) => item.citation.entity_type === "organization" && item.citation.entity_id === dossier.id)
    ?? dossier.citations?.find((item) => item.citation.entity_type === "capability" && item.citation.entity_id === capability.id);

  const fieldClass = "form-control";
  const areaClass = "form-control h-auto py-3 leading-6";

  return (
    <PublicPageShell eyebrow="Published record maintenance" title={`Edit ${dossier.name}`} description="Update the information people use to understand this organization and decide whether to engage. Stable profile links are preserved and every change is recorded." backHref="/admin/organizations" backLabel="Published organizations" actions={<Link href={`/organizations/${dossier.slug}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs font-semibold text-[#344054] no-underline">View public profile <ExternalLink className="size-3.5" /></Link>}>
      <AdminNav />
      {query.error ? <div className="mb-5 rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">{errorMessages[query.error] ?? "The organization could not be updated."}</div> : null}
      {query.success ? <div className="mb-5 rounded-md border border-[#a6f4c5] bg-[#f6fef9] px-3 py-2 text-sm text-[#067647]">{query.success === "contact-updated" ? "Public contact details updated." : "Published record updated and public map refreshed."}</div> : null}

      {capabilities.length > 1 ? (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-[#d0d5dd] bg-white p-3">
          <span className="mr-1 text-xs font-semibold text-[#667085]">Technology or offering being edited:</span>
          {capabilities.map((item) => <Link key={item.id} href={`/admin/organizations/${dossier.id}/edit?capability=${item.id}`} className={`rounded-md px-3 py-2 text-xs font-semibold no-underline ${item.id === capability.id ? "bg-[#0756d9] text-white" : "bg-[#f2f4f7] text-[#344054]"}`}>{item.name}</Link>)}
        </div>
      ) : null}

      <form action={editPublishedOrganizationContact} className="mb-5">
        <input type="hidden" name="organizationId" value={dossier.id} />
        <PublicCard title="Public contact" eyebrow="Help people take the next step">
          <p className="mb-4 max-w-3xl text-xs leading-5 text-[#667085]">Add only official contact paths supported by a public source. Leave private contacts and unknown fields blank; visitors can still request an introduction through True North Map.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <EditField label="Official contact page" help="Use the organization’s public contact or business-development page, not a personal profile."><input name="contactPageUrl" type="url" pattern="https://.*" defaultValue={publicContact.contactPageUrl ?? ""} className={fieldClass} placeholder="https://example.ca/contact" /></EditField>
            <EditField label="Public email" help="Use an email the organization publishes for general, partnerships, sales, or business-development contact."><input name="publicEmail" type="email" defaultValue={publicContact.publicEmail ?? ""} className={fieldClass} placeholder="partnerships@example.ca" /></EditField>
            <EditField label="Public phone" help="Use an organization-level phone number from an official source."><input name="publicPhone" maxLength={80} defaultValue={publicContact.publicPhone ?? ""} className={fieldClass} placeholder="+1 902 555 0100" /></EditField>
            <EditField label="LinkedIn page" help="Use the organization’s official LinkedIn page, not an individual’s profile."><input name="linkedInUrl" type="url" pattern="https://.*" defaultValue={publicContact.linkedInUrl ?? ""} className={fieldClass} placeholder="https://www.linkedin.com/company/example" /></EditField>
          </div>
          <EditField label="Why this contact is safe to publish" className="mt-4" help="Record the official source and why the details are appropriate for public use."><textarea name="contactRationale" required minLength={3} maxLength={2000} rows={3} className={areaClass} placeholder="Official contact page reviewed on…" /></EditField>
          <div className="mt-4 flex justify-end"><PendingButton type="submit" pendingLabel="Saving contact…" className="h-11 bg-[#0756d9] px-5 text-sm font-semibold text-white hover:bg-[#0649b8]">Save public contact</PendingButton></div>
        </PublicCard>
      </form>

      <form action={editPublishedOrganization} className="space-y-5">
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
          <fieldset className="mt-4 rounded-md border border-[#d0d5dd] p-4">
            <legend className="px-1 text-xs font-semibold text-[#344054]">Other technology areas</legend>
            <FieldHint>Select only areas that materially improve how people find this offering.</FieldHint>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{domains?.map((domain) => <label key={domain.id} className="flex items-center gap-2 text-xs text-[#475467]"><input type="checkbox" name="additionalDomainSlug" value={domain.slug} defaultChecked={additionalDomainSlugs.has(domain.slug)} className="size-4 accent-[#0756d9]" />{domain.name}</label>)}</div>
          </fieldset>
          <details className="mt-4 rounded-md border border-[#d0d5dd] bg-[#fcfcfd] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[#344054]">Maturity and novelty details</summary>
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
          <div className="flex items-start gap-3 rounded-md border border-[#fec84b] bg-[#fffaeb] p-3 text-xs leading-5 text-[#7a2e0e]"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>Save only source-supported changes. This editor preserves existing citations; source replacement and new evidence still belong in the review workflow.</span></div>
          {citation ? <a href={citation.source.canonical_url ?? "#"} target={citation.source.canonical_url ? "_blank" : undefined} rel="noreferrer" className="mt-4 block rounded-md border border-[#b8dfe5] bg-[#f5fcfd] p-4 no-underline"><span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#007f98]">Current supporting source</span><strong className="mt-1 block text-sm text-[#101828]">{citation.source.title}</strong><span className="mt-1 block text-xs leading-5 text-[#667085]">{citation.source.publisher} · {citation.evidence.excerpt}</span></a> : null}
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <EditField label="Profile source support" help="Rate how well the organization-level facts are supported by current public evidence."><select name="organizationConfidence" defaultValue={dossier.source_confidence} className={fieldClass}><option value="high">High</option><option value="moderate">Moderate</option><option value="needs_review">Needs review</option></select></EditField>
            <EditField label="Review status" help="Current records have recently reviewed sources. Review due and Stale keep aging evidence visible to editors."><select name="freshnessStatus" defaultValue={dossier.freshness_status} className={fieldClass}><option value="current">Current</option><option value="review_due">Review due</option><option value="stale">Stale</option></select></EditField>
            <EditField label="Change rationale"><textarea name="rationale" required minLength={3} maxLength={2000} rows={3} className={areaClass} placeholder="What changed, why, and which public evidence supports it" /></EditField>
          </div>
          <div className="mt-5 flex justify-end"><PendingButton type="submit" pendingLabel="Saving public record…" className="h-11 bg-[#0756d9] px-5 text-sm font-semibold text-white hover:bg-[#0649b8]">Save published record</PendingButton></div>
        </PublicCard>
      </form>
    </PublicPageShell>
  );
}

function EditField({ label, children, className = "", help }: { label: string; children: React.ReactNode; className?: string; help?: string }) {
  return (
    <div className={className}>
      <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">{label}{children}</label>
      {help ? (
        <details className="group relative mt-1.5 w-fit text-[10px] font-normal text-[#667085]">
          <summary className="flex cursor-pointer list-none items-center gap-1 font-semibold text-[#475467] hover:text-[#0756d9]"><CircleHelp className="size-3.5" /> What belongs here?</summary>
          <p className="relative z-10 mt-1 max-w-md rounded-md border border-[#d0d5dd] bg-white p-2.5 text-xs font-normal leading-5 text-[#475467] shadow-sm">{help}</p>
        </details>
      ) : null}
    </div>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-normal text-[#667085]">{children}</span>;
}
