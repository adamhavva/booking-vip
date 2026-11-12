import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import BottomTabBar from "@/components/sections/BottomTabBar";
import Container from "@/components/ui/Container";
import TransportBookingClient from "@/components/transport/TransportBookingClient";
import { getTransportVehicles } from "@/app/actions/catalog";
import { parsePickedPoint } from "@/lib/picked-point";

/** The query string of the booking step. */
type TransportBookingParams = {
  pickup?: string;
  dropoff?: string;
  /** The vehicle that was picked on the fleet list ("slug::packageId"). */
  vehicle?: string;
  date?: string;
  time?: string;
  days?: string;
  driverOption?: string;
};

export const metadata: Metadata = {
  title: "Detail Transport · Booking VIP",
  description: "Isi detail perjalanan untuk pesanan transport kamu.",
};

/**
 * Step 2 of the transport flow — the booking form.
 *
 * The route comes from the query string (the map step), so the page is
 * dynamic and reads the search parameters inside a Suspense boundary.
 */
export default function TransportBookingPage({
  searchParams,
}: {
  searchParams: Promise<TransportBookingParams>;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white pb-20 lg:pb-0">
      <Suspense>
        <Header variant="solid" />
      </Suspense>

      <main className="flex-1">
        <Container className="py-8 md:py-12">
          <div className="mb-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Transport · Langkah 2 dari 2
            </p>
            <h1 className="mt-1.5 text-[24px] font-bold tracking-[-0.01em] text-ink md:text-[30px]">
              Detail perjalanan
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
              Lokasi sudah dikonfirmasi. Pilih jadwal, kendaraan dan cara kami
              menghubungi kamu.
            </p>
          </div>

          <Suspense fallback={null}>
            <TransportBookingStep searchParams={searchParams} />
          </Suspense>
        </Container>
      </main>

      <Footer />
      <BottomTabBar />
    </div>
  );
}

/**
 * The dynamic part of the page: the route from the query string and the
 * vehicle list from the database.
 */
async function TransportBookingStep({
  searchParams,
}: {
  searchParams?: Promise<TransportBookingParams>;
}) {
  // The page reads the database and the query string — render it at request
  // time instead of prerendering it.
  await connection();

  const params = searchParams ? await searchParams : {};
  const pickup = parsePickedPoint(params.pickup);
  const dropoff = parsePickedPoint(params.dropoff);
  const vehicles = await getTransportVehicles();

  if (!pickup || !dropoff) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-8 text-center">
        <h2 className="text-[17px] font-bold text-ink">Lokasi belum dipilih</h2>
        <p className="mt-1.5 text-[13px] text-muted">
          Pilih titik pickup dan dropoff terlebih dahulu.
        </p>
        <a
          href="/transport/pickup"
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-brand px-5 text-[13px] font-semibold text-white transition-opacity hover:bg-brand-dark"
        >
          Pilih lokasi
        </a>
      </div>
    );
  }

  return (
    <TransportBookingClient
      pickup={pickup}
      dropoff={dropoff}
      vehicles={vehicles}
      initial={{
        vehicle: params.vehicle,
        date: params.date,
        time: params.time,
        days: params.days ? Number(params.days) || 1 : undefined,
        driverOption: params.driverOption,
      }}
    />
  );
}
