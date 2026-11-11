"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "@/components/icons";
import Field from "./Field";
import FieldControl, { type FieldSpec, type FieldValues } from "./fields";
import { adminClass } from "./tokens";
import { showAdminToast } from "./toast";
import { saveAdminEntity, type AdminEntityTable } from "@/app/actions/admin-crud";

/**
 * The shared create / update page.
 *
 * Create and update use the very same component — the only difference is
 * whether an id is present — so both flows always look the same: a titled
 * page, the field grid, and a footer with "Batal" and the save button.
 *
 * Saving is a server action that answers with a structured result
 * (`{ ok, error, field }`), so a validation failure can be rendered on the
 * field that caused it instead of in a generic banner.
 */
export default function EntityFormPage({
  table,
  id,
  title,
  subtitle,
  listPath,
  listLabel,
  fields,
  initialValues,
  loading,
  loadError,
  rowMissing,
  entityName,
}: {
  table: AdminEntityTable;
  /** The row being edited — `undefined` in create mode. */
  id?: string;
  title: string;
  subtitle?: string;
  /** Where "Batal" and the post-save redirect go. */
  listPath: string;
  /** The name of the list, used in the back link ("← Kembali ke Produk"). */
  listLabel: string;
  fields: FieldSpec[];
  initialValues: FieldValues;
  loading?: boolean;
  loadError?: string;
  /** True when the requested row does not exist (edit mode). */
  rowMissing?: boolean;
  /** The name of the edited record, shown in the page header. */
  entityName?: string | null;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--admin-line)] px-6 py-12 text-center text-[13px] text-[var(--admin-muted)]">
        Memuat data…
      </div>
    );
  }

  if (rowMissing) {
    return (
      <div className="rounded-lg border border-[var(--admin-line)] px-6 py-12 text-center">
        <p className="text-[13px] font-medium">Data tidak ditemukan</p>
        <p className="mt-1 text-[13px] text-[var(--admin-muted)]">
          Record yang Anda buka sudah tidak ada di database.
        </p>
        <Link href={listPath} className={`${adminClass.buttonSecondary} mt-4`}>
          Kembali ke {listLabel}
        </Link>
      </div>
    );
  }

  // The form itself lives in its own component so it only mounts once the
  // data is there — the initial values are then read exactly once.
  return (
    <EntityForm
      table={table}
      id={id}
      title={title}
      subtitle={subtitle}
      listPath={listPath}
      listLabel={listLabel}
      fields={fields}
      initialValues={initialValues}
      loadError={loadError}
      entityName={entityName}
    />
  );
}

/** The form body — mounted only when the data is loaded. */
function EntityForm({
  table,
  id,
  title,
  subtitle,
  listPath,
  listLabel,
  fields,
  initialValues,
  loadError,
  entityName,
}: {
  table: AdminEntityTable;
  id?: string;
  title: string;
  subtitle?: string;
  listPath: string;
  listLabel: string;
  fields: FieldSpec[];
  initialValues: FieldValues;
  loadError?: string;
  entityName?: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FieldValues>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /**
   * The id of a field control.
   *
   * It carries the table and the record id so a label never points at the
   * control of another (cached) page — the ids stay unique in the document.
   */
  const fieldId = (name: string) => `field-${table}-${id ?? "new"}-${name}`;

  const setValue = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setFieldErrors({});

    try {
      const result = await saveAdminEntity({ table, id, values });

      if (!result.ok) {
        setError(result.error);
        if (result.field) setFieldErrors({ [result.field]: result.error });
        return;
      }

      showAdminToast(result.message);
      router.push(listPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pb-6">
      <Link
        href={listPath}
        className="mb-4 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-ink)]"
      >
        <ChevronLeft width={14} height={14} />
        Kembali ke {listLabel}
      </Link>

      <div className="mb-5">
        <h1 className={adminClass.h1}>{title}</h1>
        {entityName ? (
          <p className="mt-1 break-all text-[13px] text-[var(--admin-muted)]">{entityName}</p>
        ) : null}
        {subtitle ? (
          <p className="mt-1 text-[13px] text-[var(--admin-muted)]">{subtitle}</p>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-[var(--admin-line)] bg-[var(--admin-hover)] px-3 py-2 text-[12px] text-danger">
          {error}
        </p>
      ) : null}

      {loadError ? (
        <p className="mb-4 rounded-lg border border-[var(--admin-line)] bg-[var(--admin-hover)] px-3 py-2 text-[12px] text-danger">
          {loadError}
        </p>
      ) : null}

      <div className={`${adminClass.panel} p-5 sm:p-6`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <Field
              key={f.name}
              label={f.label}
              hint={f.hint}
              wide={f.wide}
              htmlFor={fieldId(f.name)}
              error={fieldErrors[f.name]}
            >
              <FieldControl
                spec={f}
                id={fieldId(f.name)}
                value={values[f.name]}
                onChange={(v) => setValue(f.name, v)}
              />
            </Field>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 z-40 mt-5 flex items-center justify-end gap-2 border-t border-[var(--admin-line)] bg-white py-3">
        <Link href={listPath} className={adminClass.buttonSecondary}>
          Batal
        </Link>
        <button type="submit" disabled={saving} className={adminClass.buttonPrimary}>
          {saving ? "Menyimpan…" : id ? "Simpan Perubahan" : "Simpan"}
        </button>
      </div>
    </form>
  );
}
