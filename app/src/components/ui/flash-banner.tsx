import type { HTMLAttributes, ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  success: { className: "border-[var(--admin-success-border)] bg-[var(--admin-success-soft)] text-[var(--admin-success)]", icon: CircleCheck },
  error: { className: "border-[var(--admin-danger-border)] bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]", icon: CircleAlert },
  warning: { className: "border-[var(--admin-warning-border)] bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]", icon: TriangleAlert },
  info: { className: "border-[var(--admin-signal-border)] bg-[var(--admin-signal-soft)] text-[var(--admin-signal)]", icon: Info }
} as const;

export function FlashBanner({
  tone = "info",
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: keyof typeof tones; children: ReactNode }) {
  const Icon = tones[tone].icon;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("mb-5 flex items-start gap-2 rounded-xl border px-3 py-2 text-sm leading-6", tones[tone].className, className)} {...props}>
      <Icon aria-hidden="true" className="mt-1 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
