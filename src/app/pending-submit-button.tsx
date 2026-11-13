"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function PendingSubmitButton({
  children,
  className = "cta",
  pendingLabel
}: {
  children: ReactNode;
  className?: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-live="polite"
      className={`${className} ${pending ? "is-pending" : ""}`}
      disabled={pending}
      type="submit"
    >
      {pending ? <span aria-hidden="true" className="button-loading-dot" /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}
