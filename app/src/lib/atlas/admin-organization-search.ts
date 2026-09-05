import type { SupabaseClient } from "@supabase/supabase-js";
import { collectPagedRows, collectPagedRowsByIds } from "@/lib/supabase/pagination";

/** Preserve the Admin search fields while reading every matching relation. */
export async function findPublishedOrganizationIds(client: SupabaseClient, query: string): Promise<string[]> {
  const pattern = `%${query}%`;
  const search = (table: string, columns: string, field: string, published = true) => collectPagedRows(
    (from, to) => {
      let request = client.from(table).select(columns).ilike(field, pattern).order("id");
      if (published) request = request.eq("publication_status", "published");
      return request.range(from, to).returns<Record<string, unknown>[]>();
    }, `Admin ${table} search`
  );
  const [names, legalNames, capabilityNames, capabilitySummaries, tags, cities, provinces, domainNames, domainSummaries] = await Promise.all([
    search("organizations", "id", "name"),
    search("organizations", "id", "legal_name"),
    search("capabilities", "organization_id", "name"),
    search("capabilities", "organization_id", "summary"),
    collectPagedRows((from, to) => client.from("capabilities").select("organization_id, technical_tags").eq("publication_status", "published").order("id").range(from, to), "Admin capability tags"),
    search("locations", "id", "city", false),
    search("locations", "id", "province_territory", false),
    search("technical_domains", "id", "name"),
    search("technical_domains", "id", "summary")
  ]);
  const normalized = query.toLocaleLowerCase("en-CA");
  const locationIds = [...cities, ...provinces].map((row) => String(row.id));
  const domainIds = [...domainNames, ...domainSummaries].map((row) => String(row.id));
  const [locationLinks, domainLinks] = await Promise.all([
    collectPagedRowsByIds(locationIds, (batch, from, to) => client.from("organization_locations").select("organization_id").eq("publication_status", "published").in("location_id", batch).order("organization_id").order("location_id").range(from, to), "Admin organization locations"),
    collectPagedRowsByIds(domainIds, (batch, from, to) => client.from("capability_domains").select("capability_id").eq("publication_status", "published").in("technical_domain_id", batch).order("capability_id").order("technical_domain_id").range(from, to), "Admin capability domains")
  ]);
  const domainCapabilities = await collectPagedRowsByIds(domainLinks.map((row) => String(row.capability_id)),
    (batch, from, to) => client.from("capabilities").select("organization_id").eq("publication_status", "published").in("id", batch).order("id").range(from, to), "Admin technical-domain organizations");
  return [...new Set([
    ...[...names, ...legalNames].map((row) => String(row.id)),
    ...[...capabilityNames, ...capabilitySummaries, ...domainCapabilities, ...locationLinks].map((row) => String(row.organization_id)),
    ...tags.filter((row) => Array.isArray(row.technical_tags) && row.technical_tags.some((tag) => typeof tag === "string" && tag.toLocaleLowerCase("en-CA").includes(normalized))).map((row) => String(row.organization_id))
  ])].sort();
}
