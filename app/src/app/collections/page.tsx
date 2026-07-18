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
      title="Working Lists"
      description="Build private, reusable shortlists from published organizations and capabilities. Public records remain unchanged."
      actions={<span className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--atlas-surface-muted)] px-3 text-xs font-semibold text-[var(--atlas-muted)]"><FolderLock className="size-4" />Private to {user.email}</span>}
    >
      {params.error ? <div className="mb-5 rounded-md border border-[var(--atlas-danger)] bg-[var(--atlas-danger-soft)] px-3 py-2 text-sm text-[var(--atlas-danger)]">The collection action could not be completed. Check the fields and try again.</div> : null}

      {addType && addId ? (
        <PublicCard title="Save published record" eyebrow="Choose a Working List" className="mb-5 border-[var(--atlas-primary-border)] bg-[var(--atlas-primary-soft)]">
          {collections?.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <form key={collection.id} action={addSavedCollectionItem}>
                  <input type="hidden" name="collectionId" value={collection.id} />
                  <input type="hidden" name="entityType" value={addType} />
                  <input type="hidden" name="entityId" value={addId} />
                  <input type="hidden" name="returnTo" value={params.returnTo ?? `/collections/${collection.id}`} />
                  <button type="submit" className="flex w-full items-center justify-between rounded-md border border-[var(--atlas-primary-border)] bg-white px-4 py-3 text-left text-sm font-semibold text-[var(--atlas-ink-soft)] hover:border-[var(--atlas-primary)]">
                    {collection.name}<Save className="size-4 text-[var(--atlas-primary)]" />
                  </button>
                </form>
              ))}
            </div>
          ) : <p className="text-sm text-[var(--atlas-muted)]">Create your first Working List below, then return to the profile to save it.</p>}
        </PublicCard>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <PublicCard title="Your Working Lists" eyebrow={`${collections?.length ?? 0} private lists`}>
          {collections?.length ? (
            <div className="divide-y divide-[var(--atlas-border)]">
              {collections.map((collection) => (
                <Link key={collection.id} href={`/collections/${collection.id}`} className="flex items-center justify-between gap-4 py-4 text-sm no-underline first:pt-0 last:pb-0 hover:no-underline">
                  <div><p className="font-bold text-[var(--atlas-ink)]">{collection.name}</p><p className="mt-1 text-xs text-[var(--atlas-muted)]">{collection.description || "No description"}</p></div>
                  <span className="text-xs font-semibold text-[var(--atlas-primary)]">Open</span>
                </Link>
              ))}
            </div>
          ) : <div className="rounded-md border border-dashed border-[var(--atlas-border-strong)] bg-[var(--atlas-surface-muted)] px-5 py-8 text-center"><FolderLock className="mx-auto size-6 text-[var(--atlas-muted)]" /><p className="mt-3 text-sm font-semibold text-[var(--atlas-ink-soft)]">No Working Lists yet</p><p className="mt-1 text-xs text-[var(--atlas-muted)]">Create one to build a private shortlist.</p></div>}
        </PublicCard>

        <PublicCard title="Create Working List" eyebrow="Private by default">
          <form action={createSavedCollection} className="space-y-4">
            <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">Name<input name="name" required minLength={2} maxLength={100} placeholder="Atlantic undersea shortlist" className="h-10 rounded-md border border-[var(--atlas-border)] px-3 text-sm font-normal outline-none focus:border-[var(--atlas-primary)] focus:ring-4 focus:ring-[var(--atlas-primary)]/10" /></label>
            <label className="grid gap-1.5 text-xs font-semibold text-[var(--atlas-ink-soft)]">Description<textarea name="description" maxLength={500} rows={4} placeholder="What this Working List supports" className="rounded-md border border-[var(--atlas-border)] px-3 py-2 text-sm font-normal outline-none focus:border-[var(--atlas-primary)] focus:ring-4 focus:ring-[var(--atlas-primary)]/10" /></label>
            <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--atlas-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--atlas-primary-hover)]"><Plus className="size-4" />Create Working List</button>
          </form>
        </PublicCard>
      </div>
    </PublicPageShell>
  );
}
