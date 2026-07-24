-- Canonical issuer taxonomy required by the approved NRC IRAP demand signal.
-- This is a reviewed hierarchy record, not a public demand source on its own.
insert into public.demand_issuers (
  slug,
  name,
  issuer_type,
  jurisdiction,
  parent_issuer_id,
  publication_status
)
select
  'national-research-council-canada',
  'National Research Council Canada',
  'research_innovation_agency',
  'Canada',
  government.id,
  'published'
from public.demand_issuers government
where government.slug = 'government-of-canada'
on conflict (slug) do update
set
  name = excluded.name,
  issuer_type = excluded.issuer_type,
  jurisdiction = excluded.jurisdiction,
  parent_issuer_id = excluded.parent_issuer_id,
  publication_status = 'published',
  updated_at = now();

do $migration$
begin
  if not exists (
    select 1
    from public.demand_issuers issuer
    join public.demand_issuers parent on parent.id = issuer.parent_issuer_id
    where issuer.slug = 'national-research-council-canada'
      and parent.slug = 'government-of-canada'
      and issuer.publication_status = 'published'
  ) then
    raise exception 'National Research Council Canada issuer hierarchy could not be established.';
  end if;
end;
$migration$;
