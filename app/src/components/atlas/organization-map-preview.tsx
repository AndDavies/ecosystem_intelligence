"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { AtlasMapOrganization } from "@/types/atlas";

const AtlasMap = dynamic(() => import("@/components/atlas/atlas-map").then((module) => module.AtlasMap), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse bg-[var(--atlas-surface-muted)]" aria-hidden="true" />
});

export function OrganizationMapPreview({ organization }: { organization: AtlasMapOrganization }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldLoad) return;
    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setShouldLoad(true);
      observer.disconnect();
    }, { rootMargin: "320px 0px" });
    observer.observe(container);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={containerRef} className="h-full w-full">
      {shouldLoad ? (
        <AtlasMap
          organizations={[organization]}
          selectedOrganizationId={organization.id}
          onSelect={() => undefined}
          onViewportChange={() => undefined}
          interactive={false}
          compact
          baseMapProvider="openstreetmap"
          singleOrganizationZoom={organization.primaryLocation?.geographicConfidence === "exact" ? 12 : organization.primaryLocation?.geographicConfidence === "city_centroid" ? 9 : 6}
          ariaLabel={`Fixed map highlighting ${organization.name} at its published location.`}
        />
      ) : (
        <div className="h-full bg-[var(--atlas-surface-muted)]" aria-label={`Map preview for ${organization.name} loads when this section approaches the viewport.`} />
      )}
    </div>
  );
}
