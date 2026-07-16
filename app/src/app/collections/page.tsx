import Link from "next/link";
import { FolderLock, Plus, Save } from "lucide-react";
import { PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { addSavedCollectionItem, createSavedCollection } from "@/lib/actions/collections";
import { requireAtlasUser } from "@/lib/atlas/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CollectionsPage({
  searchParams
}: {
  searchParams: Promise<{ addType?: string; addId?: string; returnTo?: string; error?: string }>;
}) {
  const user = await requireAtlasUser("/collections");
  const params = await searchParams;
  const supabase = await createClient();
  const { data: collections } = await supabase
    .from("saved_collections")
    .select("id, name, description, created_at, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });
  const addType = params.addType === "organization" || params.addType === "capability" ? params.addType : null;
  const addId = /^[0-9a-f-]{36}$/i.test(params.addId ?? "") ? params.addId ?? null : null;

  return (
    <PublicPageShell
      eyebrow="Private workspace"
      title="Saved collections"
      description="Build private, reusable shortlists from published organizations and capabilities. Public records remain unchanged."
      actions={<span className="inline-flex h-9 items-center gap-2 rounded-md bg-[#f2f4f7] px-3 text-xs font-semibold text-[#475467]"><FolderLock className="size-4" />Private to {user.email}</span>}
    >
      {params.error ? <div className="mb-5 rounded-md border border-[#fda29b] bg-[#fff6f5] px-3 py-2 text-sm text-[#b42318]">The collection action could not be completed. Check the fields and try again.</div> : null}

      {addType && addId ? (
        <PublicCard title="Save published record" eyebrow="Choose a collection" className="mb-5 border-[#9bd8e2] bg-[#e7f8fa]">
          {collections?.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <form key={collection.id} action={addSavedCollectionItem}>
                  <input type="hidden" name="collectionId" value={collection.id} />
                  <input type="hidden" name="entityType" value={addType} />
                  <input type="hidden" name="entityId" value={addId} />
                  <input type="hidden" name="returnTo" value={params.returnTo ?? `/collections/${collection.id}`} />
                  <button type="submit" className="flex w-full items-center justify-between rounded-md border border-[#9bd8e2] bg-white px-4 py-3 text-left text-sm font-semibold text-[#344054] hover:border-[#007f98]">
                    {collection.name}<Save className="size-4 text-[#007f98]" />
                  </button>
                </form>
              ))}
            </div>
          ) : <p className="text-sm text-[#667085]">Create your first collection below, then return to the dossier to save it.</p>}
        </PublicCard>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <PublicCard title="Your collections" eyebrow={`${collections?.length ?? 0} private lists`}>
          {collections?.length ? (
            <div className="divide-y divide-[#eaecf0]">
              {collections.map((collection) => (
                <Link key={collection.id} href={`/collections/${collection.id}`} className="flex items-center justify-between gap-4 py-4 text-sm no-underline first:pt-0 last:pb-0 hover:no-underline">
                  <div><p className="font-bold text-[#101828]">{collection.name}</p><p className="mt-1 text-xs text-[#667085]">{collection.description || "No description"}</p></div>
                  <span className="text-xs font-semibold text-[#007f98]">Open</span>
                </Link>
              ))}
            </div>
          ) : <div className="rounded-md border border-dashed border-[#b8c2d1] bg-[#f8fafc] px-5 py-8 text-center"><FolderLock className="mx-auto size-6 text-[#98a2b3]" /><p className="mt-3 text-sm font-semibold text-[#344054]">No collections yet</p><p className="mt-1 text-xs text-[#667085]">Create one to build a private shortlist.</p></div>}
        </PublicCard>

        <PublicCard title="Create collection" eyebrow="Private by default">
          <form action={createSavedCollection} className="space-y-4">
            <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Name<input name="name" required minLength={2} maxLength={100} placeholder="Atlantic undersea shortlist" className="h-10 rounded-md border border-[#d0d5dd] px-3 text-sm font-normal outline-none focus:border-[#007f98] focus:ring-4 focus:ring-[#007f98]/10" /></label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#344054]">Description<textarea name="description" maxLength={500} rows={4} placeholder="What this collection supports" className="rounded-md border border-[#d0d5dd] px-3 py-2 text-sm font-normal outline-none focus:border-[#007f98] focus:ring-4 focus:ring-[#007f98]/10" /></label>
            <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#007f98] px-4 text-sm font-semibold text-white hover:bg-[#00677d]"><Plus className="size-4" />Create collection</button>
          </form>
        </PublicCard>
      </div>
    </PublicPageShell>
  );
}
