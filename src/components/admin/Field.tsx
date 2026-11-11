import type { ReactNode } from "react";
import { adminClass } from "./tokens";

/**
 * A labelled admin form field.
 *
 * `children` is the control itself so the same wrapper works for text inputs,
 * selects, toggles and custom pickers.
 */
export default function Field({
  label,
  hint,
  htmlFor,
  error,
  wide,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`} htmlFor={htmlFor}>
      <span className={`mb-1.5 block ${adminClass.label}`}>{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-[var(--admin-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}
