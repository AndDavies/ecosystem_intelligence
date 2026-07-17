"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function AuthSubmitButton({
  children,
  pendingLabel,
  className,
  disabled = false
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      aria-busy={pending}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55",
        className
      )}
    >
      {pending ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /><span>{pendingLabel}</span></> : children}
    </button>
  );
}
