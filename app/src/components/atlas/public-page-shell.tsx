import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { PublicAtlasFooter } from "@/components/atlas/public-atlas-footer";

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
  variant?: "public" | "admin";
  children: React.ReactNode;
}) {
  const publicBreadcrumbs = breadcrumbs?.length
    ? breadcrumbs
    : [
        { label: breadcrumbParentLabel(backLabel, backHref), href: backHref },
        { label: eyebrow }
      ];

  return (
    <main className={`atlas-page min-h-screen bg-[var(--atlas-canvas)] text-[var(--atlas-ink)] ${variant === "admin" ? "atlas-admin-shell" : ""}`}>
      <PublicAtlasHeader />
      <div className="atlas-frame py-8 sm:py-12">
        {variant === "public" ? (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              {publicBreadcrumbs.map((breadcrumb, index) => (
                <li key={`${breadcrumb.label}-${index}`} className="flex items-center gap-1.5">
                  {index ? <ChevronRight className="size-3.5 text-[var(--atlas-muted)]" aria-hidden="true" /> : null}
                  {breadcrumb.href ? (
                    <Link href={breadcrumb.href} className="rounded-md px-1 py-1 text-[var(--atlas-primary)] no-underline hover:bg-[var(--atlas-primary-soft)] hover:no-underline">
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
                  {breadcrumb.href ? <Link href={breadcrumb.href} className="rounded-md px-1 py-1 text-[var(--atlas-primary)] no-underline hover:bg-[var(--atlas-primary-soft)] hover:no-underline">{breadcrumb.label}</Link> : <span aria-current="page" className="px-1 py-1 text-[var(--atlas-muted)]">{breadcrumb.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        ) : (
          <Link href={backHref} className="inline-flex items-center gap-2 rounded-[6px] px-1 py-1 text-xs font-semibold text-[var(--atlas-muted)] no-underline hover:text-[var(--atlas-primary)] hover:no-underline">
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        )}
        {pageHeader ?? (
          <header className="atlas-page-heading mt-7 flex flex-col gap-7 border-b border-[var(--atlas-border)] pb-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="atlas-eyebrow">{eyebrow}</p>
              <h1 className="mt-3 text-3xl font-extrabold leading-[1.04] tracking-[-0.052em] text-[var(--atlas-ink)] sm:text-[46px] lg:text-[52px]">{title}</h1>
              {description ? <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)] sm:text-base sm:leading-7">{description}</p> : null}
            </div>
            {actions ? <div className="flex min-w-0 flex-wrap gap-2">{actions}</div> : null}
          </header>
        )}
        <div>{children}</div>
        <PublicAtlasFooter />
      </div>
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
  className = ""
}: {
  id?: string;
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`atlas-surface p-5 sm:p-7 ${className}`}>
      {eyebrow ? <p className="atlas-eyebrow">{eyebrow}</p> : null}
      {title ? <h2 className="mt-2 text-xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)]">{title}</h2> : null}
      <div className={title || eyebrow ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

export function EmptyCoverage({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--atlas-border-strong)] bg-[var(--atlas-surface-muted)] px-5 py-8 text-center">
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
    <section className="mt-12 rounded-[18px] bg-[var(--atlas-blue-soft)] px-5 py-6 sm:px-7 sm:py-7" aria-labelledby="collection-continuation-title">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="atlas-eyebrow">{eyebrow}</p>
          <h2 id="collection-continuation-title" className="mt-2 text-xl font-extrabold tracking-[-0.035em] text-[var(--atlas-ink)] sm:text-2xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--atlas-muted)]">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map((link, index) => (
            <Link key={link.href} href={link.href} className={`${index === 0 ? "atlas-primary-button" : "atlas-secondary-button"} min-h-11 gap-2 px-4 text-sm`}>
              {link.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
