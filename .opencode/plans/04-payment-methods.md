# Plan 04 — Metode pembayaran (kartu terenkripsi + Xendit + PayPal)

Goal: the customer can save a card (number + expiry, **no CVV**), see the other
payment methods (Xendit) and jump to PayPal.

## Scope
- Schema: `SavedCard` (`userId`, `brand`, `last4`, `encryptedNumber`, `expMonth`,
  `expYear`, `holderName`, `isDefault`).
- `src/lib/crypto.ts` — AES-256-GCM encryption with a key from the env
  (`CARD_ENCRYPTION_KEY`, 32 bytes, hex or base64). The plaintext card number is
  **never** stored and never leaves the server.
- `src/app/actions/account.ts`:
  - `saveSavedCard({ number, expMonth, expYear, holderName })` — validates the number
    (Luhn), encrypts it, stores only the last four digits in clear.
  - `deleteSavedCard(id)` — only the owner can delete.
- `src/app/account/payments/page.tsx`:
  - Saved cards list (brand, `•••• 4242`, expiry) with a delete button.
  - "Tambah kartu" form.
  - Other methods: **Xendit** (VA, QRIS, e-wallet) listed from the DB and marked as
    "akan segera tersedia" when the gateway key is not set yet.
  - **PayPal** — a link to the PayPal account (env `NEXT_PUBLIC_PAYPAL_URL`), shown
    as a separate tile.
- No CVV is ever requested, transmitted or stored.

## Done when
- A saved card shows only the masked number; the stored column is ciphertext.
- Deleting a card works; another account cannot delete it.
