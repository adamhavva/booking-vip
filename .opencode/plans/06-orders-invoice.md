# Plan 06 — Pesanan saya + invoice (unduh)

Goal: "Orders" is the order history as a table, and every order has a downloadable
invoice.

## Scope
- Schema: `Booking.invoiceNumber` (nullable, unique).
- `src/lib/invoice.ts` — the invoice number format:
  `#INV/YYYY/MM/DD/4DIGIT/2RANDOM` → `#INV/2026/11/12/4821/KQ`.
  - `YYYY/MM/DD` = the booking date, `4DIGIT` = a random four digit block, `2RANDOM`
    = two random letters (upper case).
  - The number is generated once, when the booking is created.
- `src/app/account/orders/page.tsx` — a table (kode, tanggal, layanan, total, status,
  aksi). The "Unduh invoice" action opens `/account/orders/[code]/invoice`, a printable
  invoice page (`@media print` friendly) with the booking, the price lines and the tax.
- "Simpan data penumpang" is **not** implemented (as requested).

## Done when
- The table lists the bookings; the invoice page renders and prints the invoice number.
