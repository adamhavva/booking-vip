"use client";

import { adminClass } from "./tokens";

/**
 * Money input in integer USD cents.
 *
 * The database stores integer cents, so the field edits the raw integer and
 * shows a `$12.00` preview underneath to avoid off-by-100 mistakes.
 */
export default function MoneyField({
  value,
  onChange,
  id,
  placeholder,
}: {
  value: number | null | undefined;
  onChange: (cents: number | null) => void;
  id?: string;
  placeholder?: string;
}) {
  const raw = value == null ? "" : String(value);

  return (
    <div>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        step={1}
        min={0}
        value={raw}
        placeholder={placeholder ?? "0"}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next === "" ? null : Math.max(0, Math.trunc(Number(next))));
        }}
        className={`${adminClass.input} tabular-nums`}
      />
      <span className="mt-1 block text-[11px] tabular-nums text-[var(--admin-muted)]">
        {value == null ? "—" : formatCents(value)}
      </span>
    </div>
  );
}

/** Format integer cents as a USD string. */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${(abs / 100).toFixed(2)}`;
}
