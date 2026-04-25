"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

export function PendingButton({
  children,
  pendingLabel = "Working...",
  confirmMessage,
  ...props
}: ButtonProps & {
  pendingLabel?: string;
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      {...props}
      disabled={pending || props.disabled}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }

        props.onClick?.(event);
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}
