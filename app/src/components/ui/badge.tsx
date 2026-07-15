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
        "inline-flex items-center rounded-[2px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
        tone === "default" && "bg-[var(--primary)] text-white",
        tone === "secondary" && "bg-[var(--secondary)] text-white",
        tone === "muted" && "bg-[var(--muted)] text-[var(--muted-foreground)]",
        tone === "danger" && "bg-[var(--danger)]/12 text-[var(--danger)]",
        tone === "info" && "bg-[#dff3fb] text-[#124a5c]",
        tone === "success" && "bg-[#dff4ef] text-[#0c5f50]",
        tone === "outline" && "border border-[var(--border)] bg-white text-[var(--foreground)]",
        tone === "surface" && "bg-white text-[var(--foreground)] shadow-[0_8px_18px_rgba(5,22,27,0.05)]",
        className
      )}
      {...props}
    />
  );
}
