import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[3px] border border-[var(--border)] bg-white px-4 text-sm outline-none ring-0 transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(34,138,172,0.16)]",
        className
      )}
      {...props}
    />
  );
}
