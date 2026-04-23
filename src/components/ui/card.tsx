import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("relative overflow-hidden rounded-[32px] border transition", {
  variants: {
    variant: {
      default: "glass-panel",
      hero:
        "glass-panel border-[color:rgba(31,80,51,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(242,248,243,0.88))] shadow-[var(--shadow-strong)]",
      feature:
        "glass-panel border-[color:rgba(31,80,51,0.12)] bg-[linear-gradient(180deg,rgba(31,80,51,0.1),rgba(255,255,255,0.96))] shadow-[0_24px_80px_rgba(20,34,24,0.12)]",
      strong:
        "border border-[var(--border)] bg-[var(--card-strong)] shadow-[0_22px_70px_rgba(20,34,24,0.08)]",
      muted:
        "border border-[var(--border)] bg-white/58 shadow-[0_14px_42px_rgba(20,34,24,0.05)] backdrop-blur-none",
      inset: "border border-[var(--border)] bg-white/78 shadow-none",
      rail:
        "glass-panel border-[color:rgba(31,80,51,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,244,235,0.9))] shadow-[0_20px_60px_rgba(20,34,24,0.08)]",
      ghost: "border border-[var(--border)] bg-transparent shadow-none"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export function Card({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>) {
  return <div className={cn(cardVariants({ variant }), className)} {...props} />;
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2 p-6", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-display text-xl font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-[var(--muted-foreground)]", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}
