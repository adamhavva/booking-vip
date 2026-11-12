"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getAccountOverview, type AccountOverviewDTO } from "@/app/actions/account";
import { signOutUser } from "@/app/actions/user-auth";

/**
 * The account control in the header.
 *
 * The session cookie is HttpOnly, so the header asks the server (through a
 * server action) who is signed in — once, after mount. That keeps every
 * public page statically renderable.
 *
 * Signed out it offers "Masuk / Daftar"; signed in it shows the initials of
 * the account and opens the account menu, so the sign-in links are never
 * shown to somebody who is already signed in.
 */
export default function UserMenu({ solid }: { solid: boolean }) {
  const [account, setAccount] = useState<AccountOverviewDTO | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    getAccountOverview()
      .then((result) => {
        if (!active) return;
        setAccount(result);
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Close on an outside click or Escape — the same behaviour as Popover.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const linkClass = `text-sm font-semibold ${
    solid ? "text-ink hover:text-brand" : "text-white hover:text-white/80"
  }`;

  // Nothing is rendered until the session is known, so the signed-in header
  // never flashes the sign-in links.
  if (!ready) {
    return <div className="hidden h-9 w-9 rounded-full bg-white/20 lg:block" />;
  }

  if (!account) {
    return (
      <div className="hidden items-center justify-center gap-3 text-sm lg:flex">
        <Link href="/login" className={linkClass}>
          Masuk
        </Link>
        <span className={solid ? "text-line" : "text-white/40"}>|</span>
        <Link href="/register" className={linkClass}>
          Daftar
        </Link>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu akun"
        className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold transition-colors ${
          solid
            ? "bg-brand-soft text-brand hover:bg-brand hover:text-white"
            : "bg-white/20 text-white hover:bg-white/30"
        }`}
      >
        {initialsOf(account)}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[300px] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_40px_rgba(16,24,40,0.14)]"
        >
          {/* Identity card */}
          <div className="p-3">
            <div className="rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 p-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[17px] font-bold leading-tight">
                  {account.name ?? account.email}
                </p>
                <Link
                  href="/account/profile"
                  onClick={() => setOpen(false)}
                  aria-label="Ubah profil"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 transition-opacity hover:opacity-90"
                >
                  <PencilIcon />
                </Link>
              </div>

              <p className="mt-2.5 text-[13px] text-white/90">
                {account.level ? `Tier ${account.level.name}` : "Tanpa tier"}
              </p>
              <p className="mt-1 text-[13px] font-semibold">
                {account.points.toLocaleString("id-ID")} Poin
              </p>
            </div>
          </div>

          {/* Menu */}
          <nav className="pb-1.5">
            {MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-5 py-2.5 text-[14px] text-ink transition-colors hover:bg-canvas"
              >
                {item.label}
              </Link>
            ))}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                void signOutUser().then(() => window.location.assign("/"));
              }}
              className="block w-full px-5 py-2.5 text-left text-[14px] text-ink transition-colors hover:bg-canvas"
            >
              Keluar
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

const MENU = [
  { href: "/account/orders", label: "Pesanan Saya" },
  { href: "/account/loyalty", label: "Poin & Level" },
  { href: "/account/payments", label: "Metode Pembayaran" },
  { href: "/account/reviews", label: "Review Saya" },
  { href: "/account/help", label: "Bantuan" },
  { href: "/account/settings", label: "Pengaturan" },
];

/** "Dandi Ramdani" → "DR"; falls back to the first letter of the address. */
function initialsOf(account: AccountOverviewDTO): string {
  const name = account.name?.trim();
  if (!name) return account.email.charAt(0).toUpperCase();

  const parts = name.split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase());
  return letters.join("");
}

function PencilIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
