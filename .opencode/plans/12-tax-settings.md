# Plan 12 — Pajak (key → value)

Goal: the tax is configured with **key → value** pairs, so a new tax can be added
without touching the code.

## Scope
- The storage is the existing `Setting` table (key → json value), e.g.
  - `pph12` → `"11%"`
  - `pph11` → `"9%"`
  - `pajak_lain` → `"$1"`
- `src/lib/tax.ts`:
  - `listTaxSettings()` — every key that looks like a tax (a value that ends with `%`
    or starts with `$`), sorted.
  - `parseTaxValue(value)` — `"11%"` → 11 percent, `"$1"` → 1 USD.
  - `computeTaxes(subtotalUsdCents)` — the list of taxes and the total tax.
- The invoice (`/account/orders/[code]/invoice`) and the booking summary show the tax
  lines, taken from the database.

## Done when
- Changing the `pph12` setting in the database changes the tax line on the invoice.
