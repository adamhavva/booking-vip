import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import BottomTabBar from "@/components/sections/BottomTabBar";
import Container from "@/components/ui/Container";
import TransportFleetClient, {
  type TransportFleetSearch,
} from "@/components/transport/TransportFleetClient";
import { getTransportVehicleGroups } from "@/app/actions/catalog";
import { parsePickedPoint } from "@/lib/picked-point";

export const metadata: Metadata = {
  title: "Armada · Booking VIP",
  description: "Daftar mobil yang bisa disewa beserta harganya.",
};

/**
 * The fleet list — the result of "Cari mobil" on the transport entry page.
 *
 * The search travels in the query string, so the page can be shared and
 * reloaded without losing the selection.
 */
export default function TransportFleetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
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
              Transport
            </p>
            <h1 className="mt-1.5 text-[24px] font-bold tracking-[-0.01em] text-ink md:text-[30px]">
              Pilihan armada
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
              Bandingkan mobil yang tersedia untuk tanggal dan lokasi pilihanmu.
            </p>
          </div>

          <Suspense fallback={<FleetSkeleton />}>
            <FleetStep searchParams={searchParams} />
          </Suspense>
        </Container>
      </main>

      <Footer />
      <BottomTabBar />
    </div>
  );
}

function FleetSkeleton() {
  return <div className="h-64 rounded-2xl border border-line bg-white" />;
}

/** The dynamic part: the query string and the fleet from the database. */
async function FleetStep({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();

  const params = await searchParams;
  const groups = await getTransportVehicleGroups();

  const search: TransportFleetSearch = {
    from: params.from,
    to: params.to,
    date: params.date,
    time: params.time,
    returnDate: params.returnDate,
    returnTime: params.returnTime,
    totalDays: params.totalDays,
    driverOption: params.driverOption,
    type: params.type,
    pickup: parsePickedPoint(params.pickup),
    dropoff: parsePickedPoint(params.dropoff),
  };

  return <TransportFleetClient groups={groups} search={search} />;
}
