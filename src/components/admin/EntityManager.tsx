"use client";

import { useState, type ReactNode } from "react";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import AdminDrawer from "./AdminDrawer";
import DataTable, { type Column } from "./DataTable";
import Field from "./Field";
import MoneyField from "./MoneyField";
import { adminClass } from "./tokens";

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

/**
 * The generic admin table + drawer.
 *
 * Every catalog page describes its own rows, columns and form fields and
 * plugs in a save callback; the table, drawer, form and error handling are
 * shared so all seven tabs behave identically.
 */
export default function EntityManager<T>({
  rows,
  columns,
  getKey,
  fieldsFor,
  initialValuesFor,
  onSave,
  onDelete,
  createLabel,
  editLabel,
  emptyTitle,
  emptyDescription,
  headerExtra,
  loading,
}: {
  rows: T[];
  columns: Column<T>[];
  getKey: (row: T) => string;
  /** Form description for the row being edited (null → create mode). */
  fieldsFor: (row: T | null) => FieldSpec[];
  /**
   * Initial form values for the row being edited (null → create mode).
   * May be async (e.g. relations loaded from a join table).
   */
  initialValuesFor: (row: T | null) => FieldValues | Promise<FieldValues>;
  /** Persist the form values. Throws on failure. */
  onSave: (values: FieldValues, row: T | null) => Promise<void>;
  /** Optional delete handler. */
  onDelete?: (row: T) => Promise<void>;
  createLabel: string;
  editLabel: string;
  emptyTitle?: string;
  emptyDescription?: string;
  headerExtra?: ReactNode;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [values, setValues] = useState<FieldValues>({});
  const [saving, setSaving] = useState(false);
  const [loadingValues, setLoadingValues] = useState(false);
  const [error, setError] = useState("");

  const loadValues = async (row: T | null) => {
    setLoadingValues(true);
    try {
      setValues(await initialValuesFor(row));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoadingValues(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setValues({});
    setError("");
    setOpen(true);
    void loadValues(null);
  };

  const openEdit = (row: T) => {
    setEditing(row);
    setValues({});
    setError("");
    setOpen(true);
    void loadValues(row);
  };

  const setValue = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave(values, editing);
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: T) => {
    if (!onDelete) return;
    setError("");
    try {
      await onDelete(row);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menghapus");
    }
  };

  const fields = fieldsFor(editing);

  const actionColumn: Column<T> = {
    key: "__actions",
    header: "",
    className: "w-[92px] text-right",
    render: (row) => (
      <span className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => openEdit(row)}
          aria-label={editLabel}
          title={editLabel}
          className={`${adminClass.buttonGhost} h-8 w-8 p-0`}
        >
          <PencilIcon width={15} height={15} />
        </button>
        {onDelete ? (
          <button
            type="button"
            onClick={() => handleDelete(row)}
            aria-label="Hapus"
            title="Hapus"
            className={`${adminClass.buttonGhost} h-8 w-8 p-0 text-danger`}
          >
            <TrashIcon width={15} height={15} />
          </button>
        ) : null}
      </span>
    ),
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={openCreate} className={adminClass.buttonPrimary}>
            <PlusIcon width={14} height={14} className="mr-1.5" />
            {createLabel}
          </button>
          {headerExtra}
        </div>
      </div>

      {error && !open ? (
        <p className="mb-3 rounded-lg border border-[var(--admin-line)] bg-[var(--admin-hover)] px-3 py-2 text-[12px] text-danger">
          {error}
        </p>
      ) : null}

      <div className={adminClass.panel}>
        {loading ? (
          <p className="px-6 py-10 text-center text-[13px] text-[var(--admin-muted)]">Memuat…</p>
        ) : (
          <DataTable
            columns={[...columns, actionColumn]}
            rows={rows}
            getKey={getKey}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            emptyAction={
              <button type="button" onClick={openCreate} className={adminClass.buttonSecondary}>
                {createLabel}
              </button>
            }
          />
        )}
      </div>

      <AdminDrawer
        open={open}
        title={editing ? editLabel : createLabel}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        saving={saving || loadingValues}
        error={error}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {loadingValues ? (
            <p className="col-span-full py-6 text-center text-[13px] text-[var(--admin-muted)]">
              Memuat…
            </p>
          ) : (
            fields.map((f) => (
              <Field
                key={f.name}
                label={f.label}
                hint={f.hint}
                wide={f.wide}
                htmlFor={`field-${f.name}`}
              >
                <FieldControl
                  spec={f}
                  value={values[f.name]}
                  onChange={(v) => setValue(f.name, v)}
                />
              </Field>
            ))
          )}
        </div>
      </AdminDrawer>
    </div>
  );
}

/** Renders the right control for a field spec. */
function FieldControl({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = `field-${spec.name}`;

  if (spec.kind === "toggle") {
    return (
      <label className="inline-flex items-center gap-2 pt-1.5 text-[13px]">
        <input
          id={id}
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-[var(--admin-line)]"
        />
        Aktif
      </label>
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
function TagListEditor({
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
function MultiSelect({
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
    <div id={id} className="flex max-h-52 flex-col gap-1 overflow-y-auto rounded-lg border border-[var(--admin-line)] p-2">
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
