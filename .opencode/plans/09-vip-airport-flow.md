# Plan 09 — VIP Airport Service flow (seperti Asia Fast Track, gaya kita)

Goal: the VIP Airport Service booking follows the *flow* of
`https://book.asiafasttrack.com/wordpress/booking-tool/?country_code=IDN&vendor_id=1`
(airport → date → flight → service → passenger → confirm), but it is rendered with
**our** minimal, modern style.

## Scope
- `src/app/airport-vip/page.tsx` — the booking tool (the folder already exists but is
  empty).
- Steps (all inside one page, one step at a time, our style):
  1. **Airport** — choose the arrival/departure airport (from the `Airport` table).
  2. **Tanggal & jam** — date + time.
  3. **Detail penerbangan** — flight number + airline (from the `Airline` table).
  4. **Layanan** — the products of the Airport VIP Service line.
  5. **Penumpang** — adult / child counts and the lead passenger name.
  6. **Konfirmasi** — the summary + "Lanjut ke pembayaran".
- The copy and the steps come from the database (`Setting` key/value + `SearchField`),
  so they can be changed without a deploy.
- No modal, no drawer — a full page, in line with the admin UX rules.

## Done when
- The wizard advances step by step and shows the summary at the end.
