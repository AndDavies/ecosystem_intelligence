import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[3px] px-4 py-2 text-sm font-semibold uppercase tracking-[0.06em] no-underline transition hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] !text-[var(--primary-foreground)] hover:bg-[#0b3441] hover:!text-[var(--primary-foreground)]",
        secondary:
          "bg-[var(--secondary)] !text-[var(--secondary-foreground)] hover:bg-[#1a7896] hover:!text-[var(--secondary-foreground)]",
        ghost:
          "bg-transparent !text-[var(--foreground)] hover:bg-black/5 hover:!text-[var(--foreground)]",
        outline:
          "border border-[var(--border-strong)] bg-white !text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--card-muted)] hover:!text-[var(--foreground)]",
        subtle:
          "bg-transparent !text-[var(--primary)] underline-offset-4 hover:!text-[var(--link-hover)] hover:underline",
        surface:
          "border border-[var(--border)] bg-[var(--card-strong)] !text-[var(--foreground)] shadow-[0_10px_24px_rgba(5,22,27,0.06)] hover:border-[var(--border-strong)] hover:bg-[var(--card-muted)] hover:!text-[var(--foreground)]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant }), className)} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
