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
  backLabel
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
}) {
  return (
    <div className={cn("mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between", className)}>
      <div className="space-y-2">
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
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="max-w-3xl text-sm text-[var(--muted-foreground)]">{description}</p> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
