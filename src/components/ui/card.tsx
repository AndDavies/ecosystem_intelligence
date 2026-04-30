import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("relative overflow-hidden rounded-[4px] border transition", {
  variants: {
    variant: {
      default: "glass-panel",
      hero:
        "glass-panel border-[var(--border-strong)] bg-[linear-gradient(180deg,#ffffff,#f9f9f9)] shadow-[var(--shadow-strong)]",
      feature:
        "glass-panel border-[color:rgba(18,74,92,0.22)] bg-[linear-gradient(180deg,rgba(18,74,92,0.1),#ffffff)] shadow-[0_24px_70px_rgba(5,22,27,0.13)]",
      strong:
        "border border-[var(--border)] bg-[var(--card-strong)] shadow-[0_18px_48px_rgba(5,22,27,0.08)]",
      muted:
        "border border-[var(--border)] bg-[var(--card-muted)] shadow-[0_12px_34px_rgba(5,22,27,0.05)] backdrop-blur-none",
      inset: "border border-[var(--border)] bg-white shadow-none",
      rail:
        "glass-panel border-[color:rgba(18,74,92,0.18)] bg-[linear-gradient(180deg,#ffffff,#f3f6f7)] shadow-[0_18px_48px_rgba(5,22,27,0.08)]",
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
  return <h3 className={cn("font-display text-xl font-bold tracking-[0.005em]", className)} {...props} />;
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
