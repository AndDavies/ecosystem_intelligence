import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { PublicAtlasFooter } from "@/components/atlas/public-atlas-footer";

export function PublicPageShell({
  eyebrow,
  title,
  description,
  backHref = "/",
  backLabel = "Back to ecosystem map",
  breadcrumbs,
  actions,
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
  variant?: "public" | "admin";
  children: React.ReactNode;
}) {
  return (
    <main className={`atlas-page min-h-screen bg-[var(--atlas-canvas)] text-[var(--atlas-ink)] ${variant === "admin" ? "atlas-admin-shell" : ""}`}>
      <PublicAtlasHeader />
      <div className="atlas-frame py-8 sm:py-12">
        {breadcrumbs?.length ? (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              {breadcrumbs.map((breadcrumb, index) => (
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
        ) : (
          <Link href={backHref} className="inline-flex items-center gap-2 rounded-full px-1 py-1 text-xs font-semibold text-[var(--atlas-muted)] no-underline hover:text-[var(--atlas-primary)] hover:no-underline">
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        )}
        <header className="mt-7 flex flex-col gap-7 border-b border-[var(--atlas-border)] pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <p className="atlas-eyebrow">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-[1.04] tracking-[-0.052em] text-[var(--atlas-ink)] sm:text-[46px] lg:text-[52px]">{title}</h1>
            {description ? <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)] sm:text-base sm:leading-7">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </header>
        <div>{children}</div>
        <PublicAtlasFooter />
      </div>
    </main>
  );
}

export function PublicCard({
  title,
  eyebrow,
  children,
  className = ""
}: {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`atlas-surface p-5 sm:p-7 ${className}`}>
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
