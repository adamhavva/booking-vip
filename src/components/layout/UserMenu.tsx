"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSessionUser } from "@/app/actions/user-auth";

/**
 * Header account link.
 *
 * The session cookie is HttpOnly, so the header asks the server (through a
 * server action) whether somebody is signed in — once, after mount. This
 * keeps every public page statically renderable.
 */
export default function UserMenu({ solid }: { solid: boolean }) {
  const [user, setUser] = useState<{ name: string | null; email: string } | null>(
    null,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    getSessionUser()
      .then((result) => {
        if (!active) return;
        setUser(result);
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const className = `hidden text-sm font-semibold lg:block ${
    solid ? "text-ink hover:text-brand" : "text-white hover:text-white/80"
  }`;

  if (ready && user) {
    return (
      <Link href="/account" className={className}>
        {user.name ?? "Akun Saya"}
      </Link>
    );
  }

  return (
<div className="flex items-center justify-center gap-3 text-sm">
  <Link href="/login" className={className}>
    Masuk
  </Link>
  <span className="text-gray-300">|</span>
  <Link href="/register" className={className}>
    Daftar
  </Link>
</div>

  );
}
