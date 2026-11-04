# Fix Round 4 — FX Rate Snapshot + i18n Leaks + Lead-Time Alignment Leftovers

## Summary

FX rate snapshot honored end-to-end, i18n leaks closed, and the booking wizard's date handling hardened.

## Fix Round 4 (commits 836c2b2 and earlier)

- LocaleProvider exposes `rates` so consumers read the live cached Frankfurter rate instead of a hardcoded constant.
- BookingWizard snapshots the live FX rate (`rates[currency] ?? 1`) into the booking instead of `currency === "IDR" ? 16500 : 1`.
- MyBookingLookup renders totals with `formatSnapshot(totalUsd, currencyCode, fxRate)` — the quote the customer agreed to, not the current UI locale.
- Added `formatSnapshot(usd, currencyCode, fxRate)` to `src/lib/currency.ts`.
- StepResult "Book Another" links to the product detail page `/${lineSlug}/${productSlug}`.
- i18n leaks fixed: NavBar mobile drawer "My Booking", search Suspense fallback, ServiceLayout "Back to home".
- CLAUDE.md doc error fixed: `formatMoney(usdCents)` → `formatMoney(usd)` plus `rates`/`formatSnapshot` documented.

---

# Fix Round 5 — Wizard Date Guard + Dead State + Email Normalization

## Summary

Three leftovers from the whole-branch review: missing-date crash in the wizard, a dead error state, and email/name normalization on the server.

## Changes

### M7 — Guard against missing/invalid date & time in BookingWizard
**File:** `src/components/booking/BookingWizard.tsx`
- `handleSubmit` now builds `const serviceAtValue = date && time ? new Date(`${date}T${time}:00`) : null;` and returns early with `setSubmitError(t("wizard.missingDate"))` if `!date || !time || Number.isFinite(...) === false`.
- Previously `new Date(`${date}T${time}:00`).toISOString()` threw an unhandled `RangeError` when the page was opened directly with missing/invalid params, leaving the button stuck on "Processing".
- The guard runs **before** `setIsSubmitting(true)`, so the button stays enabled and the inline message renders on the payment step.
- Added i18n keys: `wizard.missingDate` = "Please choose a valid date and time to continue." / "Pilih tanggal dan waktu yang valid untuk melanjutkan."
- Also guarded the display formatters in `StepDetails.tsx` and `BookingSummary.tsx` so an invalid date renders `""` rather than the string "Invalid Date" (both previously did `new Date(date + "T00:00:00").toLocaleDateString(...)`).

### M8 — Remove dead `error`/`setError` state
**File:** `src/components/booking/BookingWizard.tsx`
- Verified the dead state: `error` was never set; the full-page guard `if (error || !product)` is fully covered by `!product`. createBooking failures already render via `submitError` → `StepPayment` in `text-danger` on the payment step.
- Removed the dead `error`/`setError` state entirely and simplified the guard to `if (!product)` showing `t("common.productNotFound")`.
- The M7 inline error surfaced through the existing `submitError` path (the working inline error on the payment step), so no new error channel was introduced.

### M10 — Normalize email + names on the server
**File:** `src/app/actions/booking.ts`
- `createBooking`: `contact.email` is now trimmed + lowercased before storing; `firstName`/`lastName` trimmed; each traveler `fullName` trimmed.
- `getBookingByCode`: email comparison now trims + lowercases both the stored contact email and the lookup email (`contact.email.trim().toLowerCase() !== email.trim().toLowerCase()`), so case/whitespace on either side can't fail a lookup.

## i18n keys added (en / id)
- `wizard.missingDate` — "Please choose a valid date and time to continue." / "Pilih tanggal dan waktu yang valid untuk melanjutkan."

## Verification
- `npx tsc --noEmit` → TypeScript: No errors found
- `npm run build` → ✓ Compiled successfully, all routes generated
- No new dependencies; no DB/schema/migration changes