-- Prevent a single candidate with case or punctuation variants of the same
-- alias from aborting an otherwise valid atomic publication batch. The parser
-- now rejects these candidates; this database-side guard remains defensive for
-- older approved candidates already present in the review queue.
do $migration$
declare
  function_sql text;
begin
  select pg_get_functiondef('public.publish_reviewed_organization_candidates(uuid[], uuid)'::regprocedure)
    into function_sql;

  function_sql := replace(
    function_sql,
    $old$insert into public.organization_aliases (organization_id, alias, alias_type, publication_status)
    select new_organization_id, alias_value, 'other', 'published'
    from jsonb_array_elements_text(coalesce(organization_record->'aliases', '[]'::jsonb)) alias_value;$old$,
    $new$insert into public.organization_aliases (organization_id, alias, alias_type, publication_status)
    select distinct on (lower(regexp_replace(trim(alias_value), '[^a-zA-Z0-9]+', ' ', 'g')))
      new_organization_id, alias_value, 'other', 'published'
    from jsonb_array_elements_text(coalesce(organization_record->'aliases', '[]'::jsonb)) alias_value
    order by lower(regexp_replace(trim(alias_value), '[^a-zA-Z0-9]+', ' ', 'g')), alias_value
    on conflict do nothing;$new$
  );

  if function_sql = pg_get_functiondef('public.publish_reviewed_organization_candidates(uuid[], uuid)'::regprocedure) then
    raise exception 'Could not locate the organization alias insert in the publication function.';
  end if;
  execute function_sql;
end;
$migration$;
