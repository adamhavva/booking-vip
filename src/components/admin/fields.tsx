"use client";

import { useState } from "react";
import MoneyField from "./MoneyField";
import { adminClass } from "./tokens";

/**
 * The admin form vocabulary.
 *
 * Every catalog form describes itself with a list of `FieldSpec`s, so the
 * create page and the edit page render exactly the same controls — only the
 * initial values differ.
 *
 * Every control receives its `id` from the form page. The id is unique per
 * record, so a label never points at the control of another (cached) page.
 */

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "money"
  | "select"
  | "toggle"
  | "tags"
  | "multiselect";

export type FieldSpec = {
  name: string;
  label: string;
  kind: FieldKind;
  options?: { value: string; label: string }[];
  hint?: string;
  wide?: boolean;
  placeholder?: string;
};

export type FieldValues = Record<string, unknown>;

/** Renders the right control for a field spec. */
export default function FieldControl({
  spec,
  id,
  value,
  onChange,
}: {
  spec: FieldSpec;
  /** The id of the control — the field label points at it. */
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (spec.kind === "toggle") {
    return (
      <input
        id={id}
        type="checkbox"
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-[var(--admin-line)]"
      />
    );
  }

  if (spec.kind === "select") {
    return (
      <select
        id={id}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className={adminClass.input}
      >
        <option value="">— Tidak ada —</option>
        {(spec.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (spec.kind === "money") {
    return (
      <MoneyField
        id={id}
        value={typeof value === "number" ? value : null}
        onChange={(v) => onChange(v)}
      />
    );
  }

  if (spec.kind === "number") {
    return (
      <input
        id={id}
        type="number"
        step={1}
        value={typeof value === "number" ? value : ""}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next === "" ? null : Math.trunc(Number(next)));
        }}
        className={`${adminClass.input} tabular-nums`}
      />
    );
  }

  if (spec.kind === "textarea") {
    return (
      <textarea
        id={id}
        rows={3}
        value={typeof value === "string" ? value : ""}
        placeholder={spec.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${adminClass.input} h-auto py-2`}
      />
    );
  }

  if (spec.kind === "tags") {
    const list = Array.isArray(value) ? (value as string[]) : [];
    return (
      <TagListEditor
        id={id}
        values={list}
        placeholder={spec.placeholder}
        onChange={onChange}
      />
    );
  }

  if (spec.kind === "multiselect") {
    const list = Array.isArray(value) ? (value as string[]) : [];
    return (
      <MultiSelect
        id={id}
        values={list}
        options={spec.options ?? []}
        onChange={onChange}
      />
    );
  }

  return (
    <input
      id={id}
      type="text"
      value={typeof value === "string" ? value : ""}
      placeholder={spec.placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={adminClass.input}
    />
  );
}

/** Editor for a list of short strings (one per line). */
export function TagListEditor({
  id,
  values,
  onChange,
  placeholder,
}: {
  id: string;
  values: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(values.join("\n"));

  return (
    <div>
      <textarea
        id={id}
        rows={4}
        value={text}
        placeholder={placeholder ?? "Satu item per baris"}
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          );
        }}
        className={`${adminClass.input} h-auto py-2`}
      />
    </div>
  );
}

/** Multi-select built on checkboxes — no native select needed. */
export function MultiSelect({
  id,
  values,
  options,
  onChange,
}: {
  id: string;
  values: string[];
  options: { value: string; label: string }[];
  onChange: (value: string[]) => void;
}) {
  const selected = new Set(values);

  return (
    <div
      id={id}
      className="flex max-h-52 flex-col gap-1 overflow-y-auto rounded-lg border border-[var(--admin-line)] p-2"
    >
      {options.length === 0 ? (
        <span className="px-1 py-1 text-[12px] text-[var(--admin-muted)]">Tidak ada opsi</span>
      ) : (
        options.map((o) => (
          <label
            key={o.value}
            className="flex items-center gap-2 rounded px-1 py-1 text-[13px] hover:bg-[var(--admin-hover)]"
          >
            <input
              type="checkbox"
              checked={selected.has(o.value)}
              onChange={(e) => {
                const next = new Set(selected);
                if (e.target.checked) next.add(o.value);
                else next.delete(o.value);
                onChange([...next]);
              }}
              className="h-4 w-4 rounded border-[var(--admin-line)]"
            />
            <span className="truncate">{o.label}</span>
          </label>
        ))
      )}
    </div>
  );
}
