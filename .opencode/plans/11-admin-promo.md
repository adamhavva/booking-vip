# Plan 11 — Admin: menu Promo (potongan harga)

Goal: an admin menu for promos that can **cut the price** — either a fixed amount or a
percentage.

## Scope
- Schema: `PromoCode` (`code` unique, `title`, `type` = `fixed` | `percentage`,
  `value` (fixed → USD cents, percentage → 0-100), `minTotalUsdCents`, `usageLimit`,
  `usedCount`, `startsAt`, `endsAt`, `active`).
- `src/app/admin/(secure)/catalog/promos/` — the same admin UX as the catalog modules:
  - the list (`EntityManager`) with the code, the type and the value,
  - `new/page.tsx` and `[id]/page.tsx` — the same `EntityFormPage` form,
  - the delete goes through the "Confirm Delete" modal (the code is the name).
- `src/app/actions/admin-crud.ts` — `promoCode` joins `AdminEntityTable`, with the
  validation (percentage ≤ 100, fixed > 0, the code is unique).
- The customer side (`/checkout` / the booking wizard) can apply a promo code; the
  discount is computed in the booking action.

## Done when
- A promo can be created, edited and deleted from the admin area, and the code can be
  applied on a booking to cut the price.
