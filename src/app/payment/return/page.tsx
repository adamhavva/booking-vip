import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import Container from "@/components/ui/Container";
import PaymentReturn from "@/components/payment/PaymentReturn";

export const metadata: Metadata = {
  title: "Pembayaran · Booking VIP",
  description: "Status pembayaran pesanan Booking VIP kamu.",
  robots: { index: false, follow: false },
};

/**
 * The page the customer lands on after the gateway.
 *
 * The gateway redirects back with the booking code only; the page polls the
 * payment status until the money arrived.
 */
export default function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; status?: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Suspense>
        <Header variant="solid" />
      </Suspense>

      <main className="flex flex-1 items-center bg-white">
        <Container className="py-10 md:py-16">
          <Suspense fallback={null}>
            <ReturnStep searchParams={searchParams} />
          </Suspense>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

/** The dynamic part: the booking code from the query string. */
async function ReturnStep({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; status?: string }>;
}) {
  await connection();

  const params = await searchParams;
  const code = params.code?.trim();

  if (!code) {
    return (
      <div className="mx-auto w-full max-w-[460px] rounded-2xl border border-line bg-white p-6 text-center md:p-8">
        <h1 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">
          Kode pesanan tidak ditemukan
        </h1>
        <p className="mt-2 text-[13px] text-muted">
          Buka lagi tautan pembayaran yang kami kirim, atau cek pesanan kamu di
          halaman pesanan.
        </p>
      </div>
    );
  }

  return <PaymentReturn bookingCode={code} initialFailed={params.status === "failed"} />;
}
