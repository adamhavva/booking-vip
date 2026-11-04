# Fix Round 4 — FX Rate Snapshot + i18n Leaks + Lead-Time Alignment Leftovers

## Summary

Resolved 8 issues: hardcoded FX rate in booking wizard, snapshot-vs-live currency mismatch in my-booking, broken product link in StepResult, three i18n literal-string leaks, and a CLAUDE.md doc error.

## Changes

### 1. LocaleProvider — expose `rates` to consumers
**File:** `src/components/providers/LocaleProvider.tsx`
- Added `rates: Record<string, number>` to `LocaleState` type and context value.
- Consumers (BookingWizard, snapshot formatters) can now read the live cached FX rate instead of hardcoding constants.
- Updated JSDoc contract comment.

### 2. BookingWizard — use live FX rate for snapshot
**File:** `src/components/booking/BookingWizard.tsx`
- **Before:** `const fxRate = currency === "IDR" ? 16500 : 1;` (hardcoded fallback)
- **After:** `const fxRate = currency === "USD" ? 1 : (rates[currency] ?? 1);`
- The rate stored in the booking snapshot now matches the rate displayed to the user at booking time (from the localStorage-cached Frankfurter API rate, or its fallback).
- Also passes `productSlug={slug}` to `StepResult` alongside the existing `lineSlug={product.lineSlug}`.

### 3. MyBookingLookup — honor the booking snapshot
**File:** `src/components/booking/MyBookingLookup.tsx`
- **Before:** `formatMoney(item.totalUsd)` — used the user's *current* locale/currency, so switching language after booking changed the displayed amount.
- **After:** `formatSnapshot(item.totalUsd, booking.currencyCode, booking.fxRate)` — always renders in the currency and rate the customer originally agreed to.
- Applied to line items, add-ons, and the total.

### 4. `formatSnapshot` utility
**File:** `src/lib/currency.ts`
- New helper `formatSnapshot(usd, currencyCode, fxRate)` wraps `formatMoneyWith` with a single-rate map, providing a clear API for "render this amount in the fixed currency/rate recorded at booking time."

### 5. StepResult — fix broken "Book Another" link
**File:** `src/components/booking/StepResult.tsx`
- Added `productSlug: string` to Props.
- **Before:** `href={`/${lineSlug}`}` → linked to the line index (e.g. `/transport`), not the specific product.
- **After:** `href={`/${lineSlug}/${productSlug}`}` → links to the actual product detail page (e.g. `/transport/airport-transfer-dps`).

### 6. M1 — NavBar mobile drawer i18n leak
**File:** `src/components/layout/NavBar.tsx`
- **Before:** literal `"My Booking"` in the mobile drawer.
- **After:** `{t("nav.myBooking")}` — translates to "Pesanan Saya" in Indonesian.

### 7. M2 — search/page.tsx Suspense fallback i18n leak
**Files:**
- **New:** `src/app/search/SearchFallback.tsx` — client component rendering `t("search.loading")`.
- **Modified:** `src/app/search/page.tsx` — replaced inline literal `"Searching…"` with `<SearchFallback />`.
- Added i18n keys: `search.loading` = "Searching…" / "Mencari…"

### 8. M3 — ServiceLayout "Back to home" i18n leak
**Files:**
- **New:** `src/components/sections/BackToHomeLink.tsx` — client component rendering `t("home.backToHome")`.
- **Modified:** `src/components/sections/ServiceLayout.tsx` — replaced hardcoded `<Link>← Back to home</Link>` with `<BackToHomeLink />`.
- Added i18n keys: `home.backToHome` = "Back to home" / "Kembali ke beranda"

### 9. M6 — CLAUDE.md doc error
**File:** `CLAUDE.md`
- Fixed `formatMoney(usdCents)` → `formatMoney(usd)` (the function takes USD dollars, not cents).
- Updated context shape to include `rates`.
- Documented `formatSnapshot()` for fixed-value rendering.

## i18n keys added (en / id)
- `search.loading` — "Searching…" / "Mencari…"
- `home.backToHome` — "Back to home" / "Kembali ke beranda"

## Verification
- `npx tsc --noEmit` → TypeScript: No errors found
- `npm run build` → ✓ Compiled successfully, all routes generated
- No new dependencies added
- No DB/schema/migration changes

## Design decisions
- **Snapshot over live currency (option A):** My-booking shows the amount in the currency/rate the customer agreed to at booking time, not the current UI locale. This avoids the confusing scenario where a user sees $100 at booking time but Rp1,650,000 when they look it up later after switching currency.
- **`formatSnapshot` as named helper:** Instead of inlining `formatMoneyWith(usd, code, { [code]: rate })` at every call site, the named helper makes the intent explicit and keeps the call sites readable.
- **Client component extraction for i18n in server shells:** `BackToHomeLink` and `SearchFallback` are minimal client components that wrap `useLocale().t()`. This keeps the parent server components (`ServiceLayout`, `search/page.tsx`) as server components while localising the one string that needs it.
