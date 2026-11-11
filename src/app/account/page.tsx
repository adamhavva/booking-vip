import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import Container from "@/components/ui/Container";
import { getUserSession } from "@/lib/user/session";
import { listMyBookings } from "@/app/actions/booking";
import SignOutButton from "./SignOutButton";

export const metadata: Metadata = {
  title: "Akun Saya · Booking VIP",
  description: "Profil dan pesanan akun Booking VIP kamu.",
};

/** Customer account page — profile, role and the bookings made with the account. */
export default function AccountPage() {
  return (
    <>
      <Suspense>
        <Header variant="solid" />
      </Suspense>
      <main className="min-h-screen bg-canvas py-10">
        <Container>
          <Suspense fallback={null}>
            <AccountPanel />
          </Suspense>
        </Container>
      </main>
      <Footer />
    </>
  );
}

async function AccountPanel() {
  await connection();

  const session = await getUserSession();
  if (!session) {
    redirect("/login");
  }

  const bookings = await listMyBookings();

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div className="rounded-xl border border-line bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-[-0.01em] text-ink">
              {session.name ?? "Akun Saya"}
            </h1>
            <p className="mt-0.5 text-[13px] text-muted">{session.email}</p>
            <span className="mt-2 inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-dark">
              User
            </span>
          </div>
          <SignOutButton />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-[15px] font-semibold tracking-[-0.01em]">
          Pesanan saya
        </h2>

        {bookings.length === 0 ? (
          <p className="text-[13px] text-muted">
            Belum ada pesanan. Pesanan yang kamu buat setelah login akan muncul di
            sini.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {bookings.map((booking) => (
              <li
                key={booking.code}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <p className="text-[14px] font-semibold text-ink">
                    {booking.code}
                  </p>
                  <p className="text-[12px] text-muted">
                    {new Date(booking.serviceAt).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {booking.status}
                  </p>
                </div>
                <p className="text-[14px] font-semibold text-ink">
                  ${(booking.totalUsdCents / 100).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
