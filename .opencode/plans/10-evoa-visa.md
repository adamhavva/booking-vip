# Plan 10 — e-VOA: jasa pengajuan visa

Goal: Electronic Visa on Arrival is a **visa application service** — the customer asks
us to handle the visa for them.

## Scope
- Schema: `VisaApplication` (`userId`, `productId?`, `fullName`, `passportNumber`,
  `nationality`, `dateOfBirth`, `arrivalDate`, `email`, `phone`, `status`
  (`submitted` | `processing` | `approved` | `rejected`), `note?`, `createdAt`).
- `src/app/evoa/apply/page.tsx` — the application form:
  - data paspor, kewarganegaraan, tanggal lahir, tanggal kedatangan, kontak.
  - a short "Bagaimana cara kerjanya?" explainer (3 steps) — the copy comes from the
    database (`Setting` key/value) so it can be edited later.
- `src/app/actions/account.ts` — `submitVisaApplication(input)` — validates and stores
  the application, then shows the application number.
- `src/app/account/orders/page.tsx` — a second table "Pengajuan e-VOA" with the
  status of each application.

## Done when
- A submitted application gets a number, appears in "Pesanan saya" and can be listed
  again from the account.
