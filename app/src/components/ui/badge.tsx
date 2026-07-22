import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.07em]",
  {
    variants: {
      tone: {
        neutral: "border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[var(--admin-muted-strong)]",
        evidence: "border-[var(--admin-evidence-border)] bg-[var(--admin-evidence-soft)] text-[var(--admin-evidence)]",
        signal: "border-[var(--admin-signal-border)] bg-[var(--admin-signal-soft)] text-[var(--admin-signal)]",
        success: "border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
        warning: "border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]",
        danger: "border-[var(--admin-danger-border)] bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]"
      }
    },
    defaultVariants: { tone: "neutral" }
  }
);

export function Badge({ className, tone, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
