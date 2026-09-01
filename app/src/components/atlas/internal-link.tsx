import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { internalLinkMetadata, type InternalLinkEdge } from "@/lib/atlas/internal-link-graph";

export function InternalLink({
  link,
  module,
  position,
  variant = "prose",
  className = "",
  children
}: {
  link: InternalLinkEdge;
  module: string;
  position: number;
  variant?: "prose" | "plain";
  className?: string;
  children?: React.ReactNode;
}) {
  const metadata = internalLinkMetadata(link, module, position);
  return (
    <Link
      href={link.href}
      prefetch={false}
      className={`${variant === "prose" ? "atlas-prose-link" : ""} ${className}`.trim()}
      data-internal-link-role="contextual"
      data-internal-link-module={module}
      data-internal-link-presentation={metadata.presentation}
      data-internal-link-target={metadata.target}
      data-internal-link-position-band={metadata.position_band}
      data-internal-link-destination={metadata.destination}
    >
      {children ?? link.label}
    </Link>
  );
}

export function ExternalSourceLink({
  href,
  children,
  className = "",
  variant = "prose"
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "prose" | "plain";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`${variant === "prose" ? "atlas-prose-link" : ""} inline-flex items-baseline gap-1 ${className}`.trim()}
      data-internal-link-role="utility"
      data-launch-durable-source="true"
    >
      {children}
      <ExternalLink className="relative top-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
