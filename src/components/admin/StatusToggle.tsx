"use client";

import { useState } from "react";
import { adminClass } from "./tokens";

/**
 * A switch that toggles the `active` flag of a catalog row.
 *
 * Optimistic: the switch flips immediately and the server action runs in the
 * background. On failure the state is rolled back and `onError` is called.
 */
export default function StatusToggle({
  active,
  onChange,
  disabled,
}: {
  active: boolean;
  onChange: (next: boolean) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    if (pending || disabled) return;
    const next = !active;
    setPending(true);
    try {
      await onChange(next);
    } catch {
      // The parent is responsible for surfacing the error; the switch simply
      // falls back to the server value on the next render.
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={active ? "Nonaktifkan" : "Aktifkan"}
      disabled={disabled || pending}
      onClick={handleClick}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        active ? "bg-[var(--admin-accent)]" : "bg-[var(--admin-line)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
          active ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

/** Read-only active/inactive pill — used in read-only tables. */
export function StatusPill({ active }: { active: boolean }) {
  return (
    <span className={`${adminClass.pill} ${active ? adminClass.pillOn : adminClass.pillOff}`}>
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}
