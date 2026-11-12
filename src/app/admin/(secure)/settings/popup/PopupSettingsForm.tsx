"use client";

import { useEffect, useState } from "react";
import {
  loadPopupSettings,
  savePopupSettingsAction,
} from "@/app/actions/popup-admin";
import type { PopupSettingsDTO } from "@/lib/popup";
import { adminClass } from "@/components/admin/tokens";
import { showAdminToast } from "@/components/admin/toast";

/**
 * The homepage popup settings.
 *
 * A single record, so there is no list page — the form is the page. The
 * operator switches the popup on, sets how long the page waits before it
 * shows up, and the window in which it is valid.
 */
export default function PopupSettingsForm() {
  const [values, setValues] = useState<PopupSettingsDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);

  useEffect(() => {
    void (async () => {
      const settings = await loadPopupSettings();
      setValues(settings);
    })();
  }, []);

  if (!values) {
    return (
      <div className={`${adminClass.panel} px-6 py-12 text-center text-[13px] text-[var(--admin-muted)]`}>
        Memuat data…
      </div>
    );
  }

  const set = <K extends keyof PopupSettingsDTO>(
    key: K,
    value: PopupSettingsDTO[K],
  ) => {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));
    setFieldError(undefined);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setFieldError(undefined);

    const result = await savePopupSettingsAction({
      enabled: values.enabled,
      delaySeconds: String(values.delaySeconds),
      startDate: values.startDate ?? "",
      endDate: values.endDate ?? "",
      title: values.title,
      body: values.body,
      imageUrl: values.imageUrl ?? "",
      ctaLabel: values.ctaLabel,
      ctaHref: values.ctaHref,
    });

    if (!result.ok) {
      setError(result.error);
      setFieldError(result.field);
      setSaving(false);
      return;
    }

    showAdminToast(result.message);
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="pb-6">
      <div className="mb-5">
        <h1 className={adminClass.h1}>Popup Homepage</h1>
        <p className="mt-1 text-[13px] text-[var(--admin-muted)]">
          Popup yang muncul di awal halaman utama. Pengaturan tersimpan di
          database dan langsung berlaku.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-[var(--admin-line)] bg-[var(--admin-hover)] px-3 py-2 text-[12px] text-danger">
          {error}
        </p>
      ) : null}

      <div className={`${adminClass.panel} p-5 sm:p-6`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Switch */}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={values.enabled}
                onChange={(e) => set("enabled", e.target.checked)}
                className="h-4 w-4 rounded border-[var(--admin-line)]"
              />
              <span className="text-[13px] font-medium text-[var(--admin-ink)]">
                Aktifkan popup
              </span>
            </label>
            <p className="mt-1 text-[12px] text-[var(--admin-muted)]">
              Popup hanya tampil di dalam rentang tanggal yang dipilih.
            </p>
          </div>

          {/* Delay */}
          <label className="block">
            <span className={adminClass.label}>Delay (detik)</span>
            <input
              type="number"
              min={0}
              max={120}
              step={1}
              value={values.delaySeconds}
              onChange={(e) => set("delaySeconds", Number(e.target.value))}
              className={`${adminClass.input} mt-1.5 tabular-nums`}
            />
            <span className="mt-1 block text-[12px] text-[var(--admin-muted)]">
              Berapa detik halaman menunggu sebelum popup muncul.
            </span>
          </label>

          {/* Image */}
          <label className="block">
            <span className={adminClass.label}>URL gambar</span>
            <input
              type="text"
              value={values.imageUrl ?? ""}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://…"
              className={`${adminClass.input} mt-1.5`}
            />
            <span className="mt-1 block text-[12px] text-[var(--admin-muted)]">
              Kosongkan untuk popup tanpa gambar.
            </span>
          </label>

          {/* Start date */}
          <label className="block">
            <span className={adminClass.label}>Tanggal mulai</span>
            <input
              type="date"
              value={values.startDate ?? ""}
              onChange={(e) => set("startDate", e.target.value || null)}
              className={`${adminClass.input} mt-1.5`}
            />
          </label>

          {/* End date */}
          <label className="block">
            <span className={adminClass.label}>Tanggal akhir</span>
            <input
              type="date"
              value={values.endDate ?? ""}
              onChange={(e) => set("endDate", e.target.value || null)}
              className={`${adminClass.input} mt-1.5`}
            />
          </label>

          {/* Title */}
          <label className="block sm:col-span-2">
            <span className={adminClass.label}>Judul</span>
            <input
              type="text"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Promo akhir tahun"
              className={`${adminClass.input} mt-1.5`}
            />
          </label>

          {/* Body */}
          <label className="block sm:col-span-2">
            <span className={adminClass.label}>Deskripsi</span>
            <textarea
              rows={4}
              value={values.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder="Diskon 20% untuk seluruh tour package."
              className={`${adminClass.input} mt-1.5 h-auto py-2`}
            />
          </label>

          {/* CTA */}
          <label className="block">
            <span className={adminClass.label}>Label tombol</span>
            <input
              type="text"
              value={values.ctaLabel}
              onChange={(e) => set("ctaLabel", e.target.value)}
              placeholder="Lihat promo"
              className={`${adminClass.input} mt-1.5`}
            />
          </label>

          <label className="block">
            <span className={adminClass.label}>Link tombol</span>
            <input
              type="text"
              value={values.ctaHref}
              onChange={(e) => set("ctaHref", e.target.value)}
              placeholder="/tour-package"
              className={`${adminClass.input} mt-1.5`}
            />
          </label>
        </div>
      </div>

      <div className="sticky bottom-0 z-40 mt-5 flex items-center justify-end gap-2 border-t border-[var(--admin-line)] bg-white py-3">
        <button type="submit" disabled={saving} className={adminClass.buttonPrimary}>
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </form>
  );
}
