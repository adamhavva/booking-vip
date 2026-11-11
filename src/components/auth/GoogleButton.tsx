"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-client";
import { signInUserWithGoogle } from "@/app/actions/user-auth";

/**
 * "Continue with Google" button.
 *
 * The popup runs in the browser (Firebase Web SDK); the resulting id token is
 * handed to the server, which verifies it and issues the session cookie.
 */
export default function GoogleButton({
  label = "Lanjut dengan Google",
}: {
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const result = await signInWithPopup(
        getClientAuth(),
        new GoogleAuthProvider(),
      );
      const idToken = await result.user.getIdToken();
      await signInUserWithGoogle(idToken);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== "auth/popup-closed-by-user") {
        setError("Gagal masuk dengan Google. Coba lagi.");
      }
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-white text-sm font-semibold text-ink transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        {pending ? "Membuka Google…" : label}
      </button>
      {error ? (
        <p className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}

/** Inline Google "G" mark — avoids pulling in a brand asset. */
export function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}
