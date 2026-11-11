# Plan 02 — Profil saya (name, email, password)

Goal: the "Profil Saya" page shows the account information and lets the customer
update the name, the phone number and the password.

## Scope
- `src/app/account/profile/page.tsx` — read-only information (name, email, verified
  badge, phone, member since) + two forms.
- `src/app/actions/account.ts`:
  - `updateAccountProfile({ name, phone })` — updates the `User` row (server-side only).
  - `changeAccountPassword({ currentPassword, newPassword })` — verifies the current
    password through the Firebase Identity Toolkit (server side, like `signInUser`),
    then calls the Firebase Admin `updateUser` to set the new password.
- The email itself is **not** editable here (it is the Firebase identity).
- Password rules: minimum 8 characters.

## Done when
- Name/phone save updates the row and shows a toast.
- Wrong current password is refused with a friendly message; a valid change works.
