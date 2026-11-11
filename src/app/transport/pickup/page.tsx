import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import BottomTabBar from "@/components/sections/BottomTabBar";
import Container from "@/components/ui/Container";
import TransportPickupClient from "@/components/transport/TransportPickupClient";

export const metadata: Metadata = {
  title: "Pilih Lokasi · Booking VIP",
  description: "Pilih titik pickup dan dropoff untuk pemesanan transport.",
};

/**
 * Step 1 of the transport flow — the map.
 *
 * The page is a server component; the map itself needs the browser, so the
 * interactive part lives in a client component.
 */
export default function TransportPickupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white pb-20 lg:pb-0">
      <Suspense>
        <Header variant="solid" />
      </Suspense>

      <main className="flex-1">
        <Container className="py-8 md:py-12">
          <div className="mb-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Transport · Langkah 1 dari 2
            </p>
            <h1 className="mt-1.5 text-[24px] font-bold tracking-[-0.01em] text-ink md:text-[30px]">
              Tentukan lokasi perjalanan
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
              Klik peta untuk menentukan titik pickup dan dropoff, atau gunakan
              "Gunakan lokasi saya" untuk mengisi titik pickup otomatis.
            </p>
          </div>

          <Suspense fallback={null}>
            <TransportPickupClient />
          </Suspense>
        </Container>
      </main>

      <Footer />
      <BottomTabBar />
    </div>
  );
}
