import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink, Trash2 } from "lucide-react";
import { EmptyCoverage, PublicCard, PublicPageShell } from "@/components/atlas/public-page-shell";
import { removeSavedCollectionItem } from "@/lib/actions/collections";
import { requireAtlasUser } from "@/lib/atlas/auth";
import { getAtlasSnapshot } from "@/lib/atlas/repository";
import { createClient } from "@/lib/supabase/server";

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAtlasUser(`/collections/${id}`);
  const supabase = await createClient();
  const [{ data: collection }, { data: items }, snapshot] = await Promise.all([
    supabase.from("saved_collections").select("id, name, description").eq("id", id).eq("owner_id", user.id).single(),
    supabase.from("saved_collection_items").select("id, entity_type, entity_id, note, created_at").eq("collection_id", id).order("created_at"),
    getAtlasSnapshot()
  ]);
  if (!collection) notFound();

  const organizationsById = new Map(snapshot.organizations.map((organization) => [organization.id, organization]));
  const capabilitiesById = new Map(snapshot.organizations.flatMap((organization) => organization.capabilities.map((capability) => [capability.id, { capability, organization }] as const)));
  const resolved = (items ?? []).map((item) => {
    if (item.entity_type === "organization") {
      const organization = organizationsById.get(item.entity_id);
      return organization ? { item, title: organization.name, detail: organization.description, href: `/organizations/${organization.slug}`, type: "Organization" } : null;
    }
    const match = capabilitiesById.get(item.entity_id);
    return match ? { item, title: match.capability.name, detail: `${match.organization.name} · ${match.capability.summary}`, href: `/capabilities/${match.capability.slug}`, type: "Capability" } : null;
  }).filter((value): value is NonNullable<typeof value> => Boolean(value));

  return (
    <PublicPageShell
      eyebrow="Private Working List"
      title={collection.name}
      description={collection.description || "A private shortlist of published ecosystem records."}
      backHref="/collections"
      backLabel="All Working Lists"
      actions={<Link href={`/api/export?type=collection-lookbook&id=${collection.id}`} className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--atlas-border)] bg-white px-4 text-xs font-semibold text-[var(--atlas-ink-soft)] no-underline hover:bg-[var(--atlas-surface-muted)] hover:no-underline"><Download className="size-4" />Export lookbook</Link>}
    >
      <PublicCard title="Saved records" eyebrow={`${resolved.length} ${resolved.length === 1 ? "item" : "items"}`}>
        {resolved.length ? (
          <div className="divide-y divide-[var(--atlas-border)]">
            {resolved.map(({ item, title, detail, href, type }) => (
              <article key={item.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--atlas-muted)]">{type}</p>
                  <Link href={href} className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--atlas-primary)] no-underline hover:underline">{title}<ExternalLink className="size-3.5" /></Link>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--atlas-muted)]">{item.note || detail}</p>
                </div>
                <form action={removeSavedCollectionItem.bind(null, collection.id, item.id)}>
                  <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--atlas-border)] bg-white px-3 text-xs font-semibold text-[var(--atlas-muted)] hover:border-[var(--atlas-danger)] hover:text-[var(--atlas-danger)]"><Trash2 className="size-3.5" />Remove</button>
                </form>
              </article>
            ))}
          </div>
        ) : <EmptyCoverage title="No saved records" detail="Open any public organization or capability profile and save it to a Working List." />}
      </PublicCard>
    </PublicPageShell>
  );
}
