import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { PublicAtlasFooter } from "@/components/atlas/public-atlas-footer";
import { InternalLinkTelemetry } from "@/components/atlas/internal-link-telemetry";

type PublicPageVariant = "public" | "editorial" | "regional" | "dossier" | "collection" | "form" | "workspace" | "admin";

export function PublicPageShell({
  eyebrow,
  title,
  description,
  backHref = "/map",
  backLabel = "Map",
  breadcrumbs,
  actions,
  pageHeader,
  variant = "public",
  children
}: {
  eyebrow: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  pageHeader?: React.ReactNode;
  variant?: PublicPageVariant;
  children: React.ReactNode;
}) {
  const isPublicVariant = variant !== "admin";
  const publicBreadcrumbs = breadcrumbs?.length
    ? breadcrumbs
    : [
        { label: breadcrumbParentLabel(backLabel, backHref), href: backHref },
        { label: eyebrow }
      ];

  return (
    <main className={`atlas-page min-h-screen bg-[var(--atlas-canvas)] text-[var(--atlas-ink)] ${variant === "admin" ? "atlas-admin-shell" : `atlas-public-shell atlas-public-shell-${variant}`}`}>
      {isPublicVariant ? <InternalLinkTelemetry /> : null}
      <PublicAtlasHeader privateWorkspace={variant === "admin"} />
      <div className="atlas-frame atlas-shell-content">
        {isPublicVariant ? (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              {publicBreadcrumbs.map((breadcrumb, index) => (
                <li key={`${breadcrumb.label}-${index}`} className="flex items-center gap-1.5">
                  {index ? <ChevronRight className="size-3.5 text-[var(--atlas-muted)]" aria-hidden="true" /> : null}
                  {breadcrumb.href ? (
                    <Link href={breadcrumb.href} data-internal-link-role="breadcrumb" data-internal-link-module="breadcrumbs" className="rounded-md px-1 py-1 text-[var(--atlas-primary)] no-underline hover:bg-[var(--atlas-primary-soft)] hover:no-underline">
                      {breadcrumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="px-1 py-1 text-[var(--atlas-muted)]">{breadcrumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : breadcrumbs?.length ? (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={`${breadcrumb.label}-${index}`} className="flex items-center gap-1.5">
                  {index ? <ChevronRight className="size-3.5 text-[var(--atlas-muted)]" aria-hidden="true" /> : null}
                  {breadcrumb.href ? <Link href={breadcrumb.href} data-internal-link-role="breadcrumb" data-internal-link-module="breadcrumbs" className="rounded-md px-1 py-1 text-[var(--atlas-primary)] no-underline hover:bg-[var(--atlas-primary-soft)] hover:no-underline">{breadcrumb.label}</Link> : <span aria-current="page" className="px-1 py-1 text-[var(--atlas-muted)]">{breadcrumb.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        ) : (
          <Link href={backHref} data-internal-link-role="breadcrumb" data-internal-link-module="breadcrumbs" className="inline-flex items-center gap-2 rounded-[6px] px-1 py-1 text-xs font-semibold text-[var(--atlas-muted)] no-underline hover:text-[var(--atlas-primary)] hover:no-underline">
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        )}
        {pageHeader ?? (
          <header className="atlas-page-heading flex flex-col gap-5 border-b border-[var(--atlas-border)] xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="atlas-eyebrow">{eyebrow}</p>
              <h1 className="atlas-page-title mt-3 text-[var(--atlas-ink)]">{title}</h1>
              {description ? <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)] sm:text-base sm:leading-7">{description}</p> : null}
            </div>
            {actions ? <div className="flex min-w-0 flex-wrap gap-2">{actions}</div> : null}
          </header>
        )}
        <div className="atlas-page-body">{children}</div>
      </div>
      {variant === "admin" ? null : <PublicAtlasFooter />}
    </main>
  );
}

function breadcrumbParentLabel(label: string, href: string) {
  const normalized = label.replace(/^Back to\s+/i, "").replace(/^All\s+/i, "").trim();
  if (normalized) return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return href === "/map" ? "Map" : "Previous page";
}

export function PublicCard({
  id,
  title,
  eyebrow,
  children,
  className = "",
  contentClassName = ""
}: {
  id?: string;
  contentClassName?: string;
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`atlas-surface min-w-0 p-5 sm:p-7 ${className}`}>
      {eyebrow ? <p className="atlas-eyebrow">{eyebrow}</p> : null}
      {title ? <h2 className="mt-2 text-xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)]">{title}</h2> : null}
      <div className={`${title || eyebrow ? "mt-5" : ""} ${contentClassName}`}>{children}</div>
    </section>
  );
}

export function EmptyCoverage({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="border-y border-[var(--atlas-border)] px-5 py-8 text-center">
      <p className="text-sm font-semibold text-[var(--atlas-ink-soft)]">{title}</p>
      <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-[var(--atlas-muted)]">{detail}</p>
    </div>
  );
}

export function CollectionContinuation({
  eyebrow = "Continue exploring",
  title,
  description,
  links
}: {
  eyebrow?: string;
  title: string;
  description: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <section className="mt-12 border-y border-[var(--atlas-border)] py-6 sm:py-8" aria-labelledby="collection-continuation-title">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="atlas-eyebrow">{eyebrow}</p>
          <h2 id="collection-continuation-title" className="mt-2 text-xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)] sm:text-2xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--atlas-muted)]">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map((link, index) => (
            <Link key={link.href} href={link.href} data-internal-link-role="action" data-internal-link-module="collection_continuation" className={`${index === 0 ? "atlas-primary-button" : "atlas-secondary-button"} min-h-11 gap-2 px-4 text-sm`}>
              {link.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
