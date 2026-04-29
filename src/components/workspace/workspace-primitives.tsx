import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BadgeTone = "default" | "secondary" | "muted" | "danger" | "info" | "success" | "outline" | "surface";

export interface SnapshotStripItem {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  href?: string;
  hrefLabel?: string;
  tone?: BadgeTone;
}

export function SnapshotStrip({
  items,
  className
}: {
  items: SnapshotStripItem[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2 md:grid-cols-2", className ?? "xl:grid-cols-4")}>
      {items.map((item) => (
        <Card key={`${item.label}-${String(item.value)}`} variant="inset" className="rounded-[28px]">
          <CardContent className="space-y-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                {item.label}
              </div>
              {item.tone ? <Badge tone={item.tone}>{item.tone === "default" ? "Live" : item.tone}</Badge> : null}
            </div>
            <div className="text-lg font-semibold text-[var(--foreground)]">{item.value}</div>
            {item.detail ? (
              <div className="text-xs leading-5 text-[var(--muted-foreground)]">{item.detail}</div>
            ) : null}
            {item.href && item.hrefLabel ? (
              <Link href={item.href} className="inline-flex items-center gap-2 text-sm font-medium no-underline">
                {item.hrefLabel}
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DiscoveryCard({
  eyebrow,
  title,
  description,
  href,
  actionLabel = "Open",
  badges,
  footer,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  href: string;
  actionLabel?: string;
  badges?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Card variant="strong" className={cn("rounded-[30px]", className)}>
      <CardContent className="space-y-3 p-4">
        {eyebrow ? <div className="workspace-kicker">{eyebrow}</div> : null}
        {badges ? <div className="flex flex-wrap gap-1.5">{badges}</div> : null}
        <div className="space-y-2">
          <div className="text-base font-semibold">{title}</div>
          {description ? (
            <div className="text-sm leading-5 text-[var(--muted-foreground)]">{description}</div>
          ) : null}
        </div>
        {footer ? <div className="flex flex-wrap gap-1.5">{footer}</div> : null}
        <div>
          <Button asChild variant="subtle" className="justify-between">
            <Link href={href}>
              {actionLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkspaceEmptyState({
  message,
  className
}: {
  message: string;
  className?: string;
}) {
  return (
    <Card variant="muted" className={cn("rounded-[28px]", className)}>
      <CardContent className="pt-6 text-sm leading-6 text-[var(--muted-foreground)]">
        {message}
      </CardContent>
    </Card>
  );
}
