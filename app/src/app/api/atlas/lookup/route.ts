import { z } from "zod";
import { queryAtlasLookupSnapshot } from "@/lib/atlas/lookup";
import {
  getAtlasDiscoverySnapshot,
  getAtlasOrganizationLogos,
  queryAtlasExplorerSnapshot
} from "@/lib/atlas/repository";
import { privateJson } from "@/lib/product-insights/server";
import type { AtlasLookupResponse } from "@/types/atlas";

const atlasLookupRequestSchema = z.object({
  query: z.string().trim().min(2).max(120)
});

export async function POST(request: Request) {
  const parsed = atlasLookupRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson({ error: "Enter at least two characters to search published records." }, { status: 400 });
  }

  try {
    const snapshot = await getAtlasDiscoverySnapshot();
    const suggestions = queryAtlasLookupSnapshot(snapshot, parsed.data.query);
    const organizationIds = suggestions
      .filter((suggestion) => suggestion.kind === "organization")
      .map((suggestion) => suggestion.id);
    const logos = await getAtlasOrganizationLogos(organizationIds);
    const totalOrganizationMatches = queryAtlasExplorerSnapshot(snapshot, {
      query: parsed.data.query,
      page: 1,
      pageSize: 1
    }).total;
    const response: AtlasLookupResponse = {
      suggestions: suggestions.map((suggestion) => ({
        ...suggestion,
        logoUrl: suggestion.kind === "organization" ? logos[suggestion.id]?.publicUrl ?? null : undefined
      })),
      totalOrganizationMatches,
      seeAllHref: totalOrganizationMatches > 0
        ? `/map?q=${encodeURIComponent(parsed.data.query)}`
        : null
    };
    return privateJson(response);
  } catch {
    return privateJson({ error: "Published records could not be searched. Try again." }, { status: 503 });
  }
}
