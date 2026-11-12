"use client";

import { signOutUser } from "@/app/actions/user-auth";

/**
 * Log out of the customer session.
 *
 * The browser is sent to "/" with a full page load so the header re-reads
 * the session; a client-side navigation would leave it signed in.
 */
export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => {
        void signOutUser().then(() => window.location.assign("/"));
      }}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-line bg-white px-3 text-[13px] font-medium text-ink transition-colors hover:bg-canvas"
    >
      Keluar
    </button>
  );
}
