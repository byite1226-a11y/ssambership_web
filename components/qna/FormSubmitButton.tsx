"use client";

import { useFormStatus } from "react-dom";

type Props = {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
};

export function FormSubmitButton({ idleLabel, pendingLabel, className, disabled = false, name, value }: Props) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;
  return (
    <button type="submit" name={name} value={value} disabled={isDisabled} className={className}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
