"use client";

import { useEffect, useRef } from "react";
import { trackProfileEngagement } from "@/lib/product-insights/client";
import { profileEngagementActions, type ProfileEngagementAction } from "@/lib/product-insights/validation";

export function DossierEngagement({ organizationId }: { organizationId: string }) {
  const depthRecorded = useRef(false);

  useEffect(() => {
    const recordDepth = () => {
      if (depthRecorded.current) return;
      const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      if (documentHeight <= 0 || (window.scrollY + window.innerHeight) / documentHeight < 0.6) return;
      depthRecorded.current = true;
      trackProfileEngagement("depth_60", {
        organization_id: organizationId,
        target_type: "section",
        section: "dossier",
        template_version: "organization_editorial_profile_v1"
      });
    };
    const recordClick = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-profile-action]")
        : null;
      const action = target?.dataset.profileAction;
      if (!action || !profileEngagementActions.includes(action as ProfileEngagementAction)) return;
      trackProfileEngagement(action as ProfileEngagementAction, {
        organization_id: organizationId,
        target_id: target.dataset.profileTargetId,
        target_type: target.dataset.profileTargetType as "section" | "mission_area" | "public_need" | "program" | "brief" | "signal" | "map" | undefined,
        section: target.dataset.profileSection,
        template_version: "organization_editorial_profile_v1"
      });
    };
    recordDepth();
    window.addEventListener("scroll", recordDepth, { passive: true });
    document.addEventListener("click", recordClick);
    return () => {
      window.removeEventListener("scroll", recordDepth);
      document.removeEventListener("click", recordClick);
    };
  }, [organizationId]);

  return null;
}
