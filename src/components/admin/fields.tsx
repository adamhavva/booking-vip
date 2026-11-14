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
  | "multiselect"
  | "datetime"
  | "keyvalue";

/** One row of a free-form key/value list (Product.specs, ProductPackage.info). */
export type KeyValueEntry = {
  key: string;
  name: string;
  excluded?: boolean;
};

export type FieldSpec = {
  name: string;
  label: string;
  kind: FieldKind;
  options?: { value: string; label: string }[];
  hint?: string;
  wide?: boolean;
  placeholder?: string;
  /** Show this field only when another field has the given value. */
  visibleWhen?: { name: string; equals: string };
  /** Hide the "— Tidak ada —" placeholder of a select. */
  allowEmpty?: boolean;
  /**
   * Options that depend on another field's value — e.g. the products of the
   * selected service line. Resolved by the form page, which sees all values.
   */
  optionsWhen?: {
    name: string;
    byValue: Record<string, { value: string; label: string }[]>;
  };
  /** Reset these fields to an empty list when this field changes. */
  clearsOnChange?: string[];
  /** keyvalue only: show the "excluded" checkbox column (package info). */
  allowExcluded?: boolean;
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
        {spec.allowEmpty === false ? null : (
          <option value="">— Tidak ada —</option>
        )}
        {(spec.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (spec.kind === "datetime") {
    const raw =
      typeof value === "string"
        ? value
        : value instanceof Date
          ? value.toISOString().slice(0, 16)
          : "";
    return (
      <input
        id={id}
        type="datetime-local"
        value={raw}
        onChange={(e) => onChange(e.target.value)}
        className={adminClass.input}
      />
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

  if (spec.kind === "keyvalue") {
    const list = Array.isArray(value) ? (value as KeyValueEntry[]) : [];
    return (
      <KeyValueEditor
        id={id}
        values={list}
        allowExcluded={spec.allowExcluded === true}
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

/**
 * Editor for a free-form key/value list — [{ key, name, excluded? }].
 *
 * `key` is the stable machine identifier ("luggage", "fuel", …), `name` the
 * display text ("2 koper"). With `allowExcluded`, each row also carries the
 * flag that marks a cost the customer pays to the vendor directly.
 */
export function KeyValueEditor({
  id,
  values,
  allowExcluded,
  onChange,
}: {
  id: string;
  values: KeyValueEntry[];
  allowExcluded: boolean;
  onChange: (value: KeyValueEntry[]) => void;
}) {
  const update = (index: number, patch: Partial<KeyValueEntry>) => {
    onChange(values.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  return (
    <div id={id} className="space-y-2">
      {values.length === 0 ? (
        <p className="text-[12px] text-[var(--admin-muted)]">Belum ada entri.</p>
      ) : null}
      {values.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={entry.key}
            placeholder="key (mis. luggage)"
            aria-label={`Key ${index + 1}`}
            onChange={(e) => update(index, { key: e.target.value })}
            className={`${adminClass.input} w-36 shrink-0`}
          />
          <input
            type="text"
            value={entry.name}
            placeholder="Tampilan (mis. 2 koper)"
            aria-label={`Nama ${index + 1}`}
            onChange={(e) => update(index, { name: e.target.value })}
            className={adminClass.input}
          />
          {allowExcluded ? (
            <label className="flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--admin-muted)]">
              <input
                type="checkbox"
                checked={entry.excluded === true}
                onChange={(e) => update(index, { excluded: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--admin-line)]"
              />
              Excluded
            </label>
          ) : null}
          <button
            type="button"
            aria-label={`Hapus entri ${index + 1}`}
            onClick={() => onChange(values.filter((_, i) => i !== index))}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--admin-line)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, { key: "", name: "" }])}
        className="inline-flex h-8 items-center rounded-lg border border-[var(--admin-line)] px-3 text-[12px] font-semibold text-[var(--admin-ink)] hover:bg-[var(--admin-hover)]"
      >
        + Tambah entri
      </button>
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
