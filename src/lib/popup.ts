import { db } from "@/prisma/db";

/**
 * The homepage popup.
 *
 * The configuration lives in the `Setting` table under the key `home.popup`
 * as a JSON object, so the admin can change it without a deploy:
 *
 *   {
 *     "enabled": true,
 *     "delaySeconds": 3,
 *     "startDate": "2026-11-01",
 *     "endDate": "2026-12-31",
 *     "title": "Promo akhir tahun",
 *     "body": "Diskon 20% untuk seluruh tour package.",
 *     "imageUrl": "https://…",
 *     "ctaLabel": "Lihat promo",
 *     "ctaHref": "/tour-package"
 *   }
 */

export const POPUP_SETTING_KEY = "home.popup";

export type PopupSettingsDTO = {
  /** Is the popup switched on? */
  enabled: boolean;
  /** How long the page waits before the popup shows up (seconds). */
  delaySeconds: number;
  /** The popup does not show before this day (`YYYY-MM-DD`). */
  startDate: string | null;
  /** The popup stops showing after this day (`YYYY-MM-DD`). */
  endDate: string | null;
  title: string;
  body: string;
  imageUrl: string | null;
  /** The label of the call-to-action button. */
  ctaLabel: string;
  /** The link of the call-to-action button. */
  ctaHref: string;
};

/** The configuration used when nothing has been saved yet. */
export const DEFAULT_POPUP_SETTINGS: PopupSettingsDTO = {
  enabled: false,
  delaySeconds: 3,
  startDate: null,
  endDate: null,
  title: "",
  body: "",
  imageUrl: null,
  ctaLabel: "Lihat promo",
  ctaHref: "/tour-package",
};

/** Read a string field from the stored JSON value. */
function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

/** Read a boolean field from the stored JSON value. */
function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Read a number field from the stored JSON value. */
function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Read an optional date (`YYYY-MM-DD`) from the stored JSON value. */
function readDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

/** Normalise a raw JSON value into the popup configuration. */
export function parsePopupSettings(raw: unknown): PopupSettingsDTO {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_POPUP_SETTINGS };
  }

  const value = raw as Record<string, unknown>;

  return {
    enabled: readBoolean(value.enabled, DEFAULT_POPUP_SETTINGS.enabled),
    delaySeconds: Math.max(
      0,
      Math.min(120, Math.trunc(readNumber(value.delaySeconds, DEFAULT_POPUP_SETTINGS.delaySeconds))),
    ),
    startDate: readDate(value.startDate),
    endDate: readDate(value.endDate),
    title: readString(value.title, DEFAULT_POPUP_SETTINGS.title),
    body: readString(value.body, DEFAULT_POPUP_SETTINGS.body),
    imageUrl: readString(value.imageUrl, DEFAULT_POPUP_SETTINGS.imageUrl ?? "").trim() || null,
    ctaLabel: readString(value.ctaLabel, DEFAULT_POPUP_SETTINGS.ctaLabel),
    ctaHref: readString(value.ctaHref, DEFAULT_POPUP_SETTINGS.ctaHref),
  };
}

/**
 * Read the popup configuration from the database.
 *
 * A database problem must never break the homepage — the default
 * configuration (popup off) is returned instead.
 */
export async function getPopupSettings(): Promise<PopupSettingsDTO> {
  try {
    const rows = await db.orm.public.Setting
      .select("key", "value")
      .where({ key: POPUP_SETTING_KEY })
      .all();

    const raw = rows[0]?.value;
    if (raw == null) return { ...DEFAULT_POPUP_SETTINGS };

    return parsePopupSettings(raw);
  } catch {
    return { ...DEFAULT_POPUP_SETTINGS };
  }
}

/**
 * Is the popup live right now?
 *
 * It has to be enabled, its start date has to have passed, and its end date
 * must not have passed yet.
 */
export function isPopupLive(
  settings: PopupSettingsDTO,
  now: Date = new Date(),
): boolean {
  if (!settings.enabled) return false;
  if (!settings.title.trim() && !settings.body.trim()) return false;

  const today = now.toISOString().slice(0, 10);

  if (settings.startDate && today < settings.startDate) return false;
  if (settings.endDate && today > settings.endDate) return false;

  return true;
}

/**
 * Save the popup configuration.
 *
 * The row is created when it does not exist yet and updated otherwise, so
 * the key stays unique.
 */
export async function savePopupSettings(
  settings: PopupSettingsDTO,
): Promise<void> {
  const value = {
    enabled: settings.enabled,
    delaySeconds: settings.delaySeconds,
    startDate: settings.startDate,
    endDate: settings.endDate,
    title: settings.title,
    body: settings.body,
    imageUrl: settings.imageUrl,
    ctaLabel: settings.ctaLabel,
    ctaHref: settings.ctaHref,
  };

  const existing = await db.orm.public.Setting
    .select("key")
    .where({ key: POPUP_SETTING_KEY })
    .first();

  if (existing) {
    await db.orm.public.Setting
      .where({ key: POPUP_SETTING_KEY })
      .update({ value: value as never });
    return;
  }

  await db.orm.public.Setting.create({
    key: POPUP_SETTING_KEY,
    value: value as never,
  });
}
