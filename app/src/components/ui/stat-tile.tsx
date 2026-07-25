import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  href,
  linkLabel,
  className
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        {Icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--atlas-primary-soft)] text-[var(--atlas-primary)]">
            <Icon className="size-4" />
          </span>
        ) : null}
        <span className="text-3xl font-extrabold leading-none tracking-[-0.045em] text-[var(--atlas-ink)]">{value}</span>
      </div>
      <p className="mt-4 text-xs font-bold text-[var(--atlas-ink-soft)]">{label}</p>
      {hint ? <p className="mt-1 text-[11px] leading-4 text-[var(--atlas-muted)]">{hint}</p> : null}
      {href && linkLabel ? (
        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--atlas-primary)] group-hover:underline">
          {linkLabel}
          <ArrowRight className="size-3" />
        </span>
      ) : null}
    </>
  );

  // Surface styles are written as utilities rather than `.atlas-surface` so the
  // hover variants below are not overridden by that unlayered rule.
  const shell = cn(
    "flex h-full flex-col rounded-2xl border border-[var(--atlas-border)] bg-white p-4 shadow-[0_1px_2px_rgba(36,40,39,0.035)] sm:p-5",
    className
  );

  if (!href) {
    return <div className={shell}>{body}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(
        shell,
        "group no-underline transition-[translate,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[var(--atlas-border-strong)] hover:shadow-[var(--atlas-shadow-soft)] hover:no-underline"
      )}
    >
      {body}
    </Link>
  );
}
