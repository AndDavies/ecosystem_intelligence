import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-92",
        secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-92",
        ghost: "bg-transparent text-[var(--foreground)] hover:bg-white/50",
        outline: "border border-[var(--border)] bg-white/70 text-[var(--foreground)] hover:bg-white",
        subtle: "bg-[var(--primary)]/9 text-[var(--primary)] hover:bg-[var(--primary)]/14",
        surface: "border border-[var(--border)] bg-[var(--card-strong)] text-[var(--foreground)] shadow-[0_12px_32px_rgba(20,34,24,0.05)] hover:border-[var(--border-strong)] hover:bg-white"
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
