import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "secondary" | "muted" | "danger" | "info" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tone === "default" && "bg-[var(--primary)]/12 text-[var(--primary)]",
        tone === "secondary" && "bg-[var(--secondary)]/22 text-[var(--secondary-foreground)]",
        tone === "muted" && "bg-[var(--muted)] text-[var(--muted-foreground)]",
        tone === "danger" && "bg-[var(--danger)]/12 text-[var(--danger)]",
        tone === "info" && "bg-sky-100 text-sky-700",
        tone === "success" && "bg-emerald-100 text-emerald-700",
        className
      )}
      {...props}
    />
  );
}
