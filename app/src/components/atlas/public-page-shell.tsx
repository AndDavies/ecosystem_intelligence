import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicAtlasHeader } from "@/components/atlas/public-atlas-header";
import { PublicAtlasFooter } from "@/components/atlas/public-atlas-footer";

export function PublicPageShell({
  eyebrow,
  title,
  description,
  backHref = "/",
  backLabel = "Back to atlas",
  actions,
  children
}: {
  eyebrow: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="atlas-page min-h-screen bg-[#eef7f8] text-[#101828]">
      <PublicAtlasHeader />
      <div className="atlas-frame py-6 sm:py-8">
        <Link href={backHref} className="inline-flex items-center gap-2 text-xs font-semibold text-[#475467] no-underline hover:text-[#007f98] hover:no-underline">
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
        <header className="mt-5 flex flex-col gap-5 border-b border-[#d0d5dd] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#007f98]">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-[#101828] sm:text-4xl">{title}</h1>
            {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[#667085] sm:text-base sm:leading-7">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </header>
        <div className="pt-6">{children}</div>
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
    <section className={`rounded-xl border border-[#c9dce0] bg-white p-5 shadow-[0_8px_24px_rgba(5,5,43,0.045)] sm:p-6 ${className}`}>
      {eyebrow ? <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#007f98]">{eyebrow}</p> : null}
      {title ? <h2 className="mt-1 text-base font-bold tracking-[-0.015em] text-[#101828]">{title}</h2> : null}
      <div className={title || eyebrow ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function EmptyCoverage({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-dashed border-[#b8c2d1] bg-[#f8fafc] px-5 py-8 text-center">
      <p className="text-sm font-semibold text-[#344054]">{title}</p>
      <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-[#667085]">{detail}</p>
    </div>
  );
}
