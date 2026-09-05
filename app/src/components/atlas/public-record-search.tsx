"use client";

import { useRouter } from "next/navigation";
import { AtlasRecordLookup } from "@/components/atlas/atlas-record-lookup";
import { trackBetaEvent } from "@/lib/product-insights/client";
import type { AtlasLookupSuggestion } from "@/types/atlas";

/** One lookup, with each entry surface keeping its own ordinary URL state. */
export function PublicRecordSearch({ query = "", type, region, placement = "directory" }: {
  query?: string;
  type?: string;
  region?: string;
  placement?: "home" | "directory";
}) {
  const router = useRouter();
  function submit(value: string) {
    const params = new URLSearchParams();
    if (value) params.set("q", value);
    if (type) params.set("type", type);
    if (region) params.set("region", region);
    trackBetaEvent("filter_apply", { filter: "query", value: value ? "set" : "all", placement, measurement_version: "discovery_v2" }, { searchId: null });
    router.push(`/organizations${params.size ? `?${params}` : ""}`);
  }
  function select(suggestion: AtlasLookupSuggestion) {
    if (suggestion.filter) {
      router.push(suggestion.href);
      return;
    }
    trackBetaEvent("result_select", {
      organization: suggestion.organizationSlug ?? suggestion.slug,
      source: "atlas_lookup", presentation: suggestion.kind,
      target: `${suggestion.kind}:${suggestion.slug}`,
      destination: suggestion.kind === "organization" ? "organization_profile" : "capability_profile",
      placement, measurement_version: "discovery_v2"
    }, { searchId: null });
  }
  return <AtlasRecordLookup committedQuery={query} busy={false} onCommit={submit} onClear={() => submit("")} onOpenAsk={() => router.push("/map?start=need#ask-true-north")} onSearchFocus={() => undefined} onSelectSuggestion={select} submitLabel="Search the directory" />;
}
