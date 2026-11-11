import type { ReactNode } from "react";
import { adminClass } from "./tokens";

/**
 * A labelled admin form field.
 *
 * `children` is the control itself so the same wrapper works for text inputs,
 * selects, toggles and custom pickers. The control carries the `id` the
 * label points at — the wrapper is a `div`, not a `label`, so controls that
 * need their own label (a checkbox list, for instance) stay valid HTML.
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
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={htmlFor} className={`mb-1.5 block ${adminClass.label}`}>
        {label}
      </label>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-[var(--admin-muted)]">{hint}</span>
      ) : null}
    </div>
  );
}
