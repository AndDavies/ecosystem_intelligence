import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({ title, eyebrow, actions, children, className, ...props }: HTMLAttributes<HTMLElement> & { title?: ReactNode; eyebrow?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-[var(--admin-border)] bg-white p-5 shadow-[var(--atlas-shadow-soft)]", className)} {...props}>
      {title || eyebrow || actions ? (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {eyebrow ? <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--admin-muted)]">{eyebrow}</p> : null}
            {title ? <h2 className="mt-1 text-lg font-bold text-[var(--admin-ink)]">{title}</h2> : null}
          </div>
          {actions}
        </header>
      ) : null}
      {children}
    </section>
  );
}
