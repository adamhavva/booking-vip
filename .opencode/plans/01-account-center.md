# Plan 01 — Account center (Pusat Akun)

Goal: `/account` becomes the account hub (gambar 2): the site header/navbar stays exactly
as it is today, and the page body shows a points + level summary plus a grid of menu
cards.

## Scope
- `src/app/account/layout.tsx` — account shell: `Header variant="solid"` + `Footer`, white background.
- `src/app/account/page.tsx` — the hub:
  - Greeting card: name, email, role badge, **points** and the current **level**.
  - Menu grid (cards, our style — white surface, `border-line`, rounded-xl):
    `Profil Saya`, `Poin & Level`, `Metode Pembayaran`, `Review Saya`, `Pesanan`, `Bantuan`.
  - Each card links to its route; unknown pages show "Coming soon" in the middle.
- `src/components/layout/UserMenu.tsx` — already links to `/account`; keep.

## Done when
- `/account` renders the hub with the six menu cards.
- Unauthenticated visitors are redirected to `/login`.
