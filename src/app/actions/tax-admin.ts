"use server";

import { db } from "@/prisma/db";
import { getAdminSession } from "@/lib/admin/session";
import { isTaxValue, listTaxSettings, type TaxSettingDTO } from "@/lib/tax";

/**
 * The admin actions of the tax settings.
 *
 * Taxes are plain key → value pairs in the `Setting` table (see
 * `src/lib/tax.ts`), so there is no dedicated model — the admin UI just
 * reads/writes rows whose value looks like a tax ("11%", "$1").
 */

export type TaxSaveResult =
  | { ok: true; message: string }
  | { ok: false; error: string; field?: string };

const KEY_PATTERN = /^[a-z][a-z0-9._-]{1,39}$/i;

/** List every tax pair for the admin table. */
export async function listTaxSettingsAction(): Promise<TaxSettingDTO[]> {
  const session = await getAdminSession();
  if (!session) return [];
  return listTaxSettings();
}

/**
 * Create or update a tax pair.
 *
 * The key is the natural id of the `Setting` row — editing an existing key
 * overwrites its value, a new key inserts a new row.
 */
export async function saveTaxSettingAction(input: {
  key: string;
  value: string;
}): Promise<TaxSaveResult> {
  const session = await getAdminSession();
  if (!session) {
    return { ok: false, error: "Sesi admin tidak valid. Silakan masuk ulang." };
  }

  const key = input.key.trim().toLowerCase();
  const value = input.value.trim();

  if (!key || !KEY_PATTERN.test(key)) {
    return {
      ok: false,
      error: "Key harus diawali huruf dan hanya berisi huruf/angka/._- (maks 40 karakter).",
      field: "key",
    };
  }

  if (!isTaxValue(value)) {
    return {
      ok: false,
      error: 'Value harus berupa persentase ("11%") atau nominal tetap ("$1").',
      field: "value",
    };
  }

  const existing = await db.orm.public.Setting.select("key").where({ key }).first();

  if (existing) {
    await db.orm.public.Setting.where({ key }).update({ value: value as never });
  } else {
    await db.orm.public.Setting.create({ key, value: value as never });
  }

  return { ok: true, message: "Pajak berhasil disimpan." };
}

/** Delete a tax pair. */
export async function deleteTaxSettingAction(key: string): Promise<TaxSaveResult> {
  const session = await getAdminSession();
  if (!session) {
    return { ok: false, error: "Sesi admin tidak valid. Silakan masuk ulang." };
  }

  await db.orm.public.Setting.where({ key: key.trim().toLowerCase() }).deleteAll();

  return { ok: true, message: "Pajak berhasil dihapus." };
}
