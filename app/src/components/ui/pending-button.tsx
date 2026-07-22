"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

export function PendingButton({
  children,
  pendingLabel = "Working...",
  confirmMessage,
  unstyled = false,
  ...props
}: ButtonProps & {
  pendingLabel?: string;
  confirmMessage?: string;
  unstyled?: boolean;
}) {
  const { pending, data } = useFormStatus();
  const submittedValue = props.name ? data?.get(props.name) : null;
  const isCurrentAction = pending && (
    !props.name || String(submittedValue ?? "") === String(props.value ?? "")
  );
  const disabled = pending || props.disabled;

  const buttonProps = {
    ...props,
    disabled,
    "aria-busy": isCurrentAction || undefined,
    "aria-disabled": disabled || undefined,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      if (confirmMessage && !window.confirm(confirmMessage)) {
        event.preventDefault();
        return;
      }

      props.onClick?.(event);
    }
  };

  const content = (
    <>
      {isCurrentAction ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
      {isCurrentAction ? pendingLabel : children}
    </>
  );

  if (unstyled) {
    const { asChild: _asChild, size: _size, variant: _variant, ...nativeProps } = buttonProps;
    return <button {...nativeProps}>{content}</button>;
  }

  return (
    <Button {...buttonProps}>{content}</Button>
  );
}
