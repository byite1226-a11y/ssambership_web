"use client";

import { useFormStatus } from "react-dom";

type Props = {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
};

export function FormSubmitButton({ idleLabel, pendingLabel, className, disabled = false }: Props) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;
  return (
    <button type="submit" disabled={isDisabled} className={className}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
