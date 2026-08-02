"use client";

import dynamic from "next/dynamic";
import type { AtlasMapOrganization } from "@/types/atlas";

const AtlasMap = dynamic(() => import("@/components/atlas/atlas-map").then((module) => module.AtlasMap), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse bg-[var(--atlas-surface-muted)]" aria-label="Loading the Kraken Robotics map preview" />
});

export function LandingMapPreview({ organization }: { organization: AtlasMapOrganization }) {
  return (
    <AtlasMap
      organizations={[organization]}
      selectedOrganizationId={organization.id}
      onSelect={() => undefined}
      onViewportChange={() => undefined}
      interactive={false}
      ariaLabel="Fixed MapTiler view highlighting Kraken Robotics in St. John's, Newfoundland and Labrador."
    />
  );
}
