import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
  id,
  className
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-[var(--atlas-border)] pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8",
        className
      )}
    >
      <div className="min-w-0">
        <p className="atlas-eyebrow">{eyebrow}</p>
        <h2 id={id} className="mt-2 text-2xl font-extrabold tracking-[-0.042em] text-[var(--atlas-ink)] sm:text-3xl">
          {title}
        </h2>
      </div>
      {description ? <p className="max-w-lg text-sm leading-6 text-[var(--atlas-muted)]">{description}</p> : null}
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
