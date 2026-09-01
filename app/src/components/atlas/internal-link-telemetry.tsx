"use client";

import { useEffect } from "react";
import { trackBetaEvent } from "@/lib/product-insights/client";

export function InternalLinkTelemetry() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[data-internal-link-presentation]");
      if (!anchor) return;
      const { internalLinkPresentation, internalLinkTarget, internalLinkPositionBand, internalLinkDestination } = anchor.dataset;
      if (!internalLinkPresentation || !internalLinkTarget || !internalLinkPositionBand || !internalLinkDestination) return;
      void trackBetaEvent("result_select", {
        presentation: internalLinkPresentation,
        target: internalLinkTarget,
        position_band: internalLinkPositionBand,
        destination: internalLinkDestination
      });
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
