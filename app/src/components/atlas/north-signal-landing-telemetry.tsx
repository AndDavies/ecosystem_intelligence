"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { trackBetaEvent } from "@/lib/product-insights/client";
import { cn } from "@/lib/utils";

export function NorthSignalLandingTelemetry() {
  const recorded = useRef(false);
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    trackBetaEvent("newsletter_landing_view", {
      placement: "newsletter_page",
      content_type: "north_signal_landing",
      device_class: window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop"
    });
  }, []);
  return null;
}

export function NorthSignalSampleCardLink({
  href,
  label,
  className,
  showIcon = true
}: {
  href: string;
  label: string;
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={() => trackBetaEvent("newsletter_sample_open", {
        placement: "newsletter_page",
        trigger: "recent_signal_sample",
        content_type: "north_signal_landing",
        sample_path: href
      })}
      className={cn("inline-flex min-h-11 items-center gap-2 font-bold text-[var(--atlas-primary)] no-underline hover:underline", className)}
    >
      {label}{showIcon ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
    </Link>
  );
}
