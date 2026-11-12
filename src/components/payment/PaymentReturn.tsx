"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getBookingPaymentStatus } from "@/app/actions/payments";

/**
 * The page the customer lands on after the gateway.
 *
 * The gateway redirects back with the booking code only; the email that
 * proves the ownership comes from the browser (it was stored when the booking
 * was made) or is asked for.
 */

const LAST_BOOKING_KEY = "booking-vip:last-booking";

type Status = "pending" | "paid" | "failed";

export default function PaymentReturn({
  bookingCode,
  initialFailed,
}: {
  bookingCode: string;
  initialFailed?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>(
    initialFailed ? "failed" : "pending",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const poll = useCallback(async (address: string) => {
    const result = await getBookingPaymentStatus({
      bookingCode,
      email: address,
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setError(null);
    setStatus(
      result.status === "paid" || result.bookingStatus === "confirmed"
        ? "paid"
        : result.status === "failed"
          ? "failed"
          : "pending",
    );
    setLoading(false);
  }, [bookingCode]);

  // Pick up the email of the last booking, then start polling.
  useEffect(() => {
    let cancelled = false;

    try {
      const raw = localStorage.getItem(LAST_BOOKING_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { code?: string; email?: string };
        if (parsed.email && parsed.code === bookingCode) {
          if (!cancelled) {
            setEmail(parsed.email);
            void poll(parsed.email);
          }
          return;
        }
      }
    } catch {
      // Storage unavailable — the email is asked for below.
    }

    if (!cancelled) setLoading(false);
  }, [bookingCode, poll]);

  // Keep polling while the payment is still open.
  useEffect(() => {
    if (!email || status !== "pending") return;

    const timer = setInterval(() => {
      void poll(email);
    }, 5000);

    return () => clearInterval(timer);
  }, [email, status, poll]);

  /* ----------------------------------------------------------------- */
  /* Paid                                                               */
  /* ----------------------------------------------------------------- */
  if (status === "paid") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m5 13 4 4L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <h1 className="mt-4 text-[20px] font-bold tracking-[-0.01em] text-ink">
          Pembayaran berhasil
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Pesanan <span className="font-mono font-semibold text-ink">{bookingCode}</span>{" "}
          sudah dikonfirmasi. Detailnya ada di halaman Pesanan.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/account/orders"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand px-5 text-[13px] font-semibold text-white transition-opacity hover:bg-brand-dark"
          >
            Lihat pesanan saya
          </Link>
          <Link
            href="/my-booking"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-5 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
          >
            Detail pesanan
          </Link>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------------- */
  /* Failed                                                             */
  /* ----------------------------------------------------------------- */
  if (status === "failed") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-8 text-center">
        <h1 className="text-[20px] font-bold tracking-[-0.01em] text-ink">
          Pembayaran belum selesai
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Pembayaran kamu belum berhasil. Kamu bisa mencoba lagi dari halaman
          pesanan.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/account/orders"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand px-5 text-[13px] font-semibold text-white transition-opacity hover:bg-brand-dark"
          >
            Coba lagi
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-5 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------------- */
  /* Pending                                                            */
  /* ----------------------------------------------------------------- */
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          className="animate-spin text-brand-dark"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <h1 className="mt-4 text-[20px] font-bold tracking-[-0.01em] text-ink">
        Memproses pembayaran kamu
      </h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        Halaman ini diperbarui otomatis. Jangan tutup halaman ini.
      </p>

      {!email ? (
        <form
          className="mt-6 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setLoading(true);
            void poll(email.trim());
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email yang dipakai saat memesan"
            className="h-11 flex-1 rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
          />
          <button
            type="submit"
            className="h-11 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white transition-opacity hover:bg-brand-dark"
          >
            Periksa
          </button>
        </form>
      ) : (
        <p className="mt-6 text-[12px] text-muted">
          Memeriksa status pembayaran untuk{" "}
          <span className="font-medium text-ink">{email}</span>…
        </p>
      )}

      {error ? (
        <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-[13px] text-danger">
          {error}
        </p>
      ) : null}

      {loading && !email ? null : null}
    </div>
  );
}
