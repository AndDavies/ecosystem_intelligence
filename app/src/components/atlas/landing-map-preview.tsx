"use client";

import dynamic from "next/dynamic";
import type { AtlasMapOrganization } from "@/types/atlas";

const AtlasMap = dynamic(() => import("@/components/atlas/atlas-map").then((module) => module.AtlasMap), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse bg-[var(--atlas-surface-muted)]" aria-label="Loading map preview" />
});

export function LandingMapPreview({
  organization,
  callout
}: {
  organization: AtlasMapOrganization;
  callout: { name: string; locationName: string; locationAccuracy: string };
}) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden border border-[var(--atlas-border)] bg-[var(--atlas-surface-muted)]">
      <AtlasMap organizations={[organization]} selectedOrganizationId={organization.id} onSelect={() => undefined} onViewportChange={() => undefined} />
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-[8px] border border-white/80 bg-white/95 px-3 py-2 shadow-[var(--atlas-shadow-soft)] backdrop-blur-sm">
        <p className="text-xs font-extrabold text-[var(--atlas-ink)]">{callout.name}</p>
        <p className="mt-0.5 text-[11px] text-[var(--atlas-muted)]">{callout.locationName} · {callout.locationAccuracy} location</p>
      </div>
    </div>
  );
}
