import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import BottomTabBar from "@/components/sections/BottomTabBar";
import Container from "@/components/ui/Container";
import TransportFleetClient, {
  type TransportFleetSearch,
} from "@/components/transport/TransportFleetClient";
import { parsePickedPoint } from "@/lib/picked-point";

export const metadata: Metadata = {
  title: "Armada · Booking VIP",
  description: "Daftar mobil yang bisa disewa beserta harganya.",
};

/**
 * The fleet list — the result of "Cari mobil" on the transport entry page.
 *
 * The search travels in the query string, so the page can be shared and
 * reloaded without losing the selection. The list itself is fetched on the
 * client through `searchTransport` (cursor + limit, infinite scroll).
 */
export default function TransportFleetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas pb-20 lg:pb-0">
      <Suspense>
        <Header variant="solid" />
      </Suspense>

      <main className="flex-1">
        <Container className="py-6 md:py-8">
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
  return (
    <div className="space-y-4">
      <div className="h-14 rounded-2xl border border-line bg-white" />
      <div className="h-9 w-2/3 rounded-full bg-white" />
      <div className="h-36 rounded-2xl border border-line bg-white" />
      <div className="h-36 rounded-2xl border border-line bg-white" />
    </div>
  );
}

/** The dynamic part: the query string handed to the results client. */
async function FleetStep({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

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

  return <TransportFleetClient search={search} />;
}