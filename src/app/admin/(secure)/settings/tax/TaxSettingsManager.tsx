"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteTaxSettingAction,
  listTaxSettingsAction,
  saveTaxSettingAction,
} from "@/app/actions/tax-admin";
import type { TaxSettingDTO } from "@/lib/tax";
import { adminClass } from "@/components/admin/tokens";
import { showAdminToast } from "@/components/admin/toast";

/**
 * The tax settings.
 *
 * Taxes are key → value pairs ("pph12" → "11%", "pajak1" → "$1") stored in
 * the generic `Setting` table — there is no dedicated model, so this page is
 * a small table + a one-row form instead of the usual list/create/edit flow.
 */
export default function TaxSettingsManager() {
  const [rows, setRows] = useState<TaxSettingDTO[] | null>(null);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await listTaxSettingsAction();
    setRows(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setFieldError(undefined);

    const result = await saveTaxSettingAction({ key, value });
    if (!result.ok) {
      setError(result.error);
      setFieldError(result.field);
      setSaving(false);
      return;
    }

    showAdminToast(result.message);
    setKey("");
    setValue("");
    setSaving(false);
    void load();
  };

  const remove = async (taxKey: string) => {
    if (deletingKey) return;
    setDeletingKey(taxKey);
    const result = await deleteTaxSettingAction(taxKey);
    if (result.ok) {
      showAdminToast(result.message);
      void load();
    } else {
      showAdminToast(result.error);
    }
    setDeletingKey(null);
  };

  return (
    <div className="pb-6">
      <div className="mb-5">
        <h1 className={adminClass.h1}>Pajak</h1>
        <p className="mt-1 text-[13px] text-[var(--admin-muted)]">
          Pajak yang diterapkan ke setiap subtotal booking. Gunakan{" "}
          <code className="rounded bg-[var(--admin-hover)] px-1 py-0.5 text-[12px]">11%</code>{" "}
          untuk persentase atau{" "}
          <code className="rounded bg-[var(--admin-hover)] px-1 py-0.5 text-[12px]">$1</code>{" "}
          untuk nominal tetap (USD).
        </p>
      </div>

      <div className={`${adminClass.panel} mb-5 p-5`}>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          {error ? (
            <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-hover)] px-3 py-2 text-[12px] text-danger sm:col-span-3">
              {error}
            </p>
          ) : null}

          <label className="block">
            <span className={adminClass.label}>Key</span>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="pph12"
              className={`${adminClass.input} mt-1 ${fieldError === "key" ? "border-danger" : ""}`}
            />
          </label>

          <label className="block">
            <span className={adminClass.label}>Value</span>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="11% atau $1"
              className={`${adminClass.input} mt-1 ${fieldError === "value" ? "border-danger" : ""}`}
            />
          </label>

          <div className="flex items-end">
            <button type="submit" disabled={saving} className={adminClass.buttonPrimary}>
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>

      <div className={adminClass.panel}>
        <table className="w-full">
          <thead>
            <tr>
              <th className={adminClass.tableHead}>Key</th>
              <th className={adminClass.tableHead}>Label</th>
              <th className={adminClass.tableHead}>Value</th>
              <th className={adminClass.tableHead}>Jenis</th>
              <th className={adminClass.tableHead} />
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr>
                <td colSpan={5} className={`${adminClass.tableCell} text-center text-[var(--admin-muted)]`}>
                  Memuat data…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className={`${adminClass.tableCell} text-center text-[var(--admin-muted)]`}>
                  Belum ada pajak. Tambahkan lewat form di atas.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.key} className={adminClass.tableRow}>
                  <td className={adminClass.tableCell}>
                    <code className="text-[12px]">{row.key}</code>
                  </td>
                  <td className={adminClass.tableCell}>{row.label}</td>
                  <td className={adminClass.tableCell}>{row.value}</td>
                  <td className={adminClass.tableCell}>
                    <span className={`${adminClass.pill} ${adminClass.pillOn}`}>
                      {row.kind === "percentage" ? "Persentase" : "Nominal tetap"}
                    </span>
                  </td>
                  <td className={`${adminClass.tableCell} text-right`}>
                    <button
                      type="button"
                      onClick={() => void remove(row.key)}
                      disabled={deletingKey === row.key}
                      className={adminClass.buttonGhost}
                    >
                      {deletingKey === row.key ? "Menghapus…" : "Hapus"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
