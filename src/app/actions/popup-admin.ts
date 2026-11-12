"use server";

import { getAdminSession } from "@/lib/admin/session";
import {
  DEFAULT_POPUP_SETTINGS,
  getPopupSettings,
  parsePopupSettings,
  savePopupSettings,
  type PopupSettingsDTO,
} from "@/lib/popup";

/**
 * The admin actions of the homepage popup.
 *
 * Both are gated by the admin session — the same check the rest of the admin
 * area uses. The layout already guards the page, but an action can be called
 * directly, so the check is repeated here.
 */

export type PopupSaveResult =
  | { ok: true; message: string }
  | { ok: false; error: string; field?: string };

/** Read the popup configuration for the admin form. */
export async function loadPopupSettings(): Promise<PopupSettingsDTO> {
  const session = await getAdminSession();
  if (!session) return { ...DEFAULT_POPUP_SETTINGS };
  return getPopupSettings();
}

/**
 * Save the popup configuration.
 *
 * The values arrive as plain strings from the form, so they are validated
 * here: the delay has to be a number, and the dates have to be real dates.
 */
export async function savePopupSettingsAction(
  values: Record<string, unknown>,
): Promise<PopupSaveResult> {
  const session = await getAdminSession();
  if (!session) {
    return { ok: false, error: "Sesi admin tidak valid. Silakan masuk ulang." };
  }

  const delayRaw = String(values.delaySeconds ?? "").trim();
  const delay = Number(delayRaw);

  if (delayRaw === "" || !Number.isFinite(delay) || delay < 0) {
    return {
      ok: false,
      error: "Delay harus berupa angka (detik) yang tidak negatif.",
      field: "delaySeconds",
    };
  }

  if (Math.trunc(delay) > 120) {
    return {
      ok: false,
      error: "Delay maksimal 120 detik.",
      field: "delaySeconds",
    };
  }

  const startDate = readDate(values.startDate, "startDate");
  if (startDate === "invalid") {
    return { ok: false, error: "Tanggal mulai tidak valid.", field: "startDate" };
  }

  const endDate = readDate(values.endDate, "endDate");
  if (endDate === "invalid") {
    return { ok: false, error: "Tanggal akhir tidak valid.", field: "endDate" };
  }

  if (startDate !== "empty" && endDate !== "empty" && startDate > endDate) {
    return {
      ok: false,
      error: "Tanggal akhir harus setelah tanggal mulai.",
      field: "endDate",
    };
  }

  const title = String(values.title ?? "").trim();
  const body = String(values.body ?? "").trim();

  if (!title && !body) {
    return {
      ok: false,
      error: "Isi judul atau deskripsi popup.",
      field: "title",
    };
  }

  const ctaHref = String(values.ctaHref ?? "").trim() || "/";

  try {
    await savePopupSettings(
      parsePopupSettings({
        enabled: values.enabled === true || values.enabled === "on",
        delaySeconds: Math.trunc(delay),
        startDate: startDate === "empty" ? null : startDate,
        endDate: endDate === "empty" ? null : endDate,
        title,
        body,
        imageUrl: String(values.imageUrl ?? "").trim(),
        ctaLabel: String(values.ctaLabel ?? "").trim(),
        ctaHref,
      }),
    );
  } catch {
    return { ok: false, error: "Gagal menyimpan pengaturan popup." };
  }

  return { ok: true, message: "Pengaturan popup berhasil disimpan." };
}

/**
 * Read a date field.
 *
 * Returns the normalised date, "empty" for a blank field, or "invalid" when
 * the value is not a real `YYYY-MM-DD` date.
 */
function readDate(value: unknown, field: string): string | "empty" | "invalid" {
  const text = String(value ?? "").trim();
  if (!text) return "empty";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "invalid";
  const date = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "invalid";
  return text;
}
