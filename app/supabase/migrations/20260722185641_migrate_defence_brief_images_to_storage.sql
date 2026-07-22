-- Replace bundled Defence Brief artwork paths with the canonical public
-- Storage URLs after the six approved launch images have been uploaded.
update public.wiki_pages
set hero_image_path = 'https://facoactpdckkhciamflk.supabase.co/storage/v1/object/public/brief-images/' || split_part(hero_image_path, '/imagery/briefs/', 2),
    updated_at = timezone('utc', now())
where hero_image_path like '/imagery/briefs/%';
