import { db } from "@/prisma/db";

/**
 * Taxes — configured as key → value pairs.
 *
 * The pairs live in the `Setting` table, so a new tax can be added without a
 * deploy:
 *
 *   key: pph12   value: 11%
 *   key: pph11   value: 9%
 *   key: pajak1  value: $1
 *
 * A value that ends with `%` is a percentage of the subtotal, a value that
 * starts with `$` is a fixed amount in USD.
 */

export type TaxSettingDTO = {
  key: string;
  /** The raw value as stored in the database — "11%", "$1". */
  value: string;
  /** The label shown on the invoice — the key, humanised. */
  label: string;
  /** "percentage" | "fixed". */
  kind: "percentage" | "fixed";
  /** The numeric part: 11 for "11%", 1 for "$1" (USD). */
  amount: number;
};

export type TaxLineDTO = {
  key: string;
  label: string;
  value: string;
  kind: "percentage" | "fixed";
  amount: number;
  /** The computed tax in USD cents. */
  amountUsdCents: number;
};

/** Does this value look like a tax? */
export function isTaxValue(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const text = value.trim();
  if (text.length === 0) return false;
  return text.endsWith("%") || text.startsWith("$");
}

/**
 * Parse a tax value.
 *
 * "11%" → percentage 11, "$1" → fixed 1 USD, "$1.50" → fixed 1.50 USD.
 */
export function parseTaxValue(value: unknown): { kind: "percentage" | "fixed"; amount: number } | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text.length === 0) return null;

  if (text.endsWith("%")) {
    const amount = Number(text.slice(0, -1).trim());
    if (!Number.isFinite(amount) || amount < 0) return null;
    return { kind: "percentage", amount };
  }

  if (text.startsWith("$")) {
    const amount = Number(text.slice(1).trim());
    if (!Number.isFinite(amount) || amount < 0) return null;
    return { kind: "fixed", amount };
  }

  return null;
}

/** Turn a key into a readable label — "pph12" → "PPH12". */
function labelForKey(key: string): string {
  return key
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Every tax pair stored in the database, sorted by key. */
export async function listTaxSettings(): Promise<TaxSettingDTO[]> {
  const rows = await db.orm.public.Setting.select("key", "value").all();

  const taxes: TaxSettingDTO[] = [];
  for (const row of rows) {
    const value = typeof row.value === "string" ? row.value : null;
    if (!value || !isTaxValue(value)) continue;

    const parsed = parseTaxValue(value);
    if (!parsed) continue;

    taxes.push({
      key: row.key,
      value: value.trim(),
      label: labelForKey(row.key),
      kind: parsed.kind,
      amount: parsed.amount,
    });
  }

  return taxes.sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Compute the tax lines for a subtotal.
 *
 * A percentage is rounded to the nearest cent; a fixed amount is converted
 * from USD to cents.
 */
export function computeTaxes(
  settings: TaxSettingDTO[],
  subtotalUsdCents: number,
): { lines: TaxLineDTO[]; totalUsdCents: number } {
  const lines: TaxLineDTO[] = [];

  for (const setting of settings) {
    let amountUsdCents = 0;

    if (setting.kind === "percentage") {
      amountUsdCents = Math.round((subtotalUsdCents * setting.amount) / 100);
    } else {
      amountUsdCents = Math.round(setting.amount * 100);
    }

    lines.push({
      key: setting.key,
      label: setting.label,
      value: setting.value,
      kind: setting.kind,
      amount: setting.amount,
      amountUsdCents,
    });
  }

  return {
    lines,
    totalUsdCents: lines.reduce((sum, line) => sum + line.amountUsdCents, 0),
  };
}

/** The taxes of a subtotal, read from the database in one go. */
export async function computeTaxesFor(
  subtotalUsdCents: number,
): Promise<{ lines: TaxLineDTO[]; totalUsdCents: number }> {
  const settings = await listTaxSettings();
  return computeTaxes(settings, subtotalUsdCents);
}
