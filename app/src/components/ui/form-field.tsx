import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const adminFieldClass = "w-full rounded-xl border border-[var(--admin-border)] bg-white px-3 text-sm font-normal text-[var(--admin-ink)] outline-none transition focus:border-[var(--admin-action)] focus:ring-4 focus:ring-[var(--admin-action-soft)] disabled:cursor-not-allowed disabled:bg-[var(--admin-surface-muted)] disabled:text-[var(--admin-muted)]";

export function FormField({ label, hint, className, children }: { label: ReactNode; hint?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <label className={cn("grid gap-1.5 text-xs font-semibold text-[var(--admin-ink-soft)]", className)}>
      <span>{label}</span>
      {children}
      {hint ? <span className="text-[11px] font-normal leading-5 text-[var(--admin-muted)]">{hint}</span> : null}
    </label>
  );
}

export function AdminInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(adminFieldClass, "h-10", className)} {...props} />;
}

export function AdminSelect({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(adminFieldClass, "h-10", className)} {...props} />;
}

export function AdminTextarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(adminFieldClass, "px-3 py-2 leading-6", className)} {...props} />;
}
