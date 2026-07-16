import { readFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const candidatePath = process.argv[2];
  if (!candidatePath) throw new Error("Usage: tsx scripts/generate-atlas-migration.ts <candidate-batch>");
  const batch = JSON.parse(await readFile(path.resolve(process.cwd(), candidatePath), "utf8"));
  if (batch.status !== "approved") throw new Error("Only approved public-atlas batches can produce promotion SQL.");
  const records = JSON.stringify(batch.records).replaceAll("$atlas$", "");
  const reviewedAt = batch.approvedAt;

  process.stdout.write(`-- Generated from ${batch.batchId}. Claims remain limited to reviewed first-party evidence.
do $$
declare
  record jsonb;
  organization_id uuid;
  location_id uuid;
  capability_id uuid;
  source_id uuid;
  evidence_id uuid;
  mission_match_id uuid;
  domain_id uuid;
  cluster_id uuid;
begin
  if exists (
    select 1 from public.organizations
    where slug in (select value->>'slug' from jsonb_array_elements($atlas$${records}$atlas$::jsonb))
  ) then
    raise exception 'Promotion stopped: candidate organization slug already exists';
  end if;

  for record in select value from jsonb_array_elements($atlas$${records}$atlas$::jsonb) loop
    insert into public.organizations (
      slug, name, description, website_url, entity_kind, organization_categories,
      profile_data, publication_status, source_confidence, freshness_status, last_reviewed_at, published_at
    ) values (
      record->>'slug', record->>'name', record->>'description', record->>'websiteUrl', 'company',
      array['commercial_company', 'dual_use'],
      jsonb_build_object('ingestion_batch_id', '${batch.batchId}', 'reviewed_by', '${batch.reviewedBy}'),
      'published', record->>'confidence', 'current', '${reviewedAt}'::timestamptz, '${reviewedAt}'::timestamptz
    ) returning id into organization_id;

    insert into public.locations (name, city, province_territory, country_code, latitude, longitude, geographic_confidence)
    values ((record->>'city') || ', ' || (record->>'provinceTerritory'), record->>'city', record->>'provinceTerritory', 'CA',
      (record->>'latitude')::double precision, (record->>'longitude')::double precision, 'city_centroid')
    returning id into location_id;
    insert into public.organization_locations (organization_id, location_id, location_role, is_primary, publication_status)
    values (organization_id, location_id, 'headquarters', true, 'published');

    insert into public.capabilities (
      organization_id, slug, name, summary, capability_type, core_features, defence_applications, technical_tags,
      publication_status, source_confidence, last_reviewed_at, published_at
    ) values (
      organization_id, record#>>'{capability,slug}', record#>>'{capability,name}', record#>>'{capability,summary}', record#>>'{capability,type}',
      array(select jsonb_array_elements_text(record#>'{capability,features}')),
      array(select jsonb_array_elements_text(record#>'{capability,applications}')),
      array(select jsonb_array_elements_text(record#>'{capability,tags}')),
      'published', record->>'confidence', '${reviewedAt}'::timestamptz, '${reviewedAt}'::timestamptz
    ) returning id into capability_id;

    select id into strict domain_id from public.technical_domains where slug = record#>>'{capability,technicalDomainSlug}';
    insert into public.capability_domains (capability_id, technical_domain_id, is_primary, publication_status)
    values (capability_id, domain_id, true, 'published');

    if nullif(record#>>'{capability,clusterSlug}', '') is not null then
      select id into strict cluster_id from public.ecosystem_clusters where slug = record#>>'{capability,clusterSlug}';
      insert into public.capability_clusters (capability_id, ecosystem_cluster_id, publication_status)
      values (capability_id, cluster_id, 'published');
    end if;

    insert into public.capability_mission_matches (
      capability_id, mission_area_id, alignment_summary, match_type, confidence, review_status, publication_status
    ) select capability_id, id, record#>>'{capability,alignmentSummary}', 'derived', record->>'confidence', 'approved', 'published'
      from public.mission_areas where slug = '${batch.missionAreaSlug}'
    returning id into mission_match_id;

    insert into public.sources (title, canonical_url, publisher, source_type, visibility, accessed_at, public_approved, notes)
    values (record#>>'{source,title}', record#>>'{source,url}', record#>>'{source,publisher}', record#>>'{source,type}', 'public',
      '${reviewedAt}'::timestamptz, true, 'Approved first-party source from ${batch.batchId}.')
    returning id into source_id;
    insert into public.evidence_snippets (source_id, excerpt, source_locator, visibility, public_approved, extracted_at)
    values (source_id, record#>>'{source,excerpt}', 'Reviewed source summary', 'public', true, '${reviewedAt}'::timestamptz)
    returning id into evidence_id;
    insert into public.field_citations (entity_type, entity_id, field_name, evidence_snippet_id) values
      ('organization', organization_id, 'description', evidence_id),
      ('capability', capability_id, 'summary', evidence_id),
      ('capability_mission_match', mission_match_id, 'alignment_summary', evidence_id);
  end loop;
end $$;
`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
