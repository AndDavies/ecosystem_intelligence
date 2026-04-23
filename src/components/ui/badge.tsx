import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "secondary" | "muted" | "danger" | "info" | "success" | "outline" | "surface";
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
        tone === "outline" && "border border-[var(--border)] bg-white/80 text-[var(--foreground)]",
        tone === "surface" && "bg-white/75 text-[var(--foreground)] shadow-[0_10px_20px_rgba(20,34,24,0.04)]",
        className
      )}
      {...props}
    />
  );
}
