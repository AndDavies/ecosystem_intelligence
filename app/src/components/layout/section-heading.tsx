import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageBreadcrumbs } from "@/components/layout/page-breadcrumbs";
import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  description,
  actions,
  className,
  breadcrumbs,
  backHref,
  backLabel,
  eyebrow,
  meta
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  backHref?: string;
  backLabel?: string;
  eyebrow?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="space-y-3">
        {backHref && backLabel ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        ) : null}
        {breadcrumbs?.length ? <PageBreadcrumbs items={breadcrumbs} /> : null}
        {eyebrow ? <div className="workspace-kicker">{eyebrow}</div> : null}
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-bold tracking-[0.005em] md:text-4xl">{title}</h2>
          {description ? <p className="max-w-3xl text-sm leading-7 text-[var(--muted-foreground)] md:text-[15px]">{description}</p> : null}
        </div>
        {meta ? <div className="flex flex-wrap gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
