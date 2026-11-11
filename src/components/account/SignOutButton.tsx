"use client";

import { signOutUser } from "@/app/actions/user-auth";

/** Log out of the customer session. */
export default function SignOutButton() {
  return (
    <form action={signOutUser}>
      <button
        type="submit"
        className="inline-flex h-9 items-center justify-center rounded-lg border border-line bg-white px-3 text-[13px] font-medium text-ink transition-colors hover:bg-canvas"
      >
        Keluar
      </button>
    </form>
  );
}
