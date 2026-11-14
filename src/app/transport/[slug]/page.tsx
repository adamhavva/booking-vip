import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import Container from "@/components/ui/Container";
import TransportDetailClient, {
  type TransportDetailSearch,
} from "@/components/transport/TransportDetailClient";
import { getTransportDetail } from "@/app/actions/transport";
import { parsePickedPoint } from "@/lib/picked-point";

export const metadata: Metadata = {
  title: "Detail Mobil · Booking VIP",
  description: "Detail kendaraan, paket sewa dan harga sebelum memesan.",
};

/**
 * The vehicle detail — the photo carousel, the vendor card, the reviews,
 * the booking rules and the selectable rental packages with the sticky
 * total bar. The booking itself stays in the shared `/booking/[slug]` wizard.
 */
export default function TransportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Suspense>
        <Header variant="solid" />
      </Suspense>
      <main className="flex-1">
        <Suspense fallback={<DetailSkeleton />}>
          <DetailStep params={params} searchParams={searchParams} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <Container className="space-y-6 py-8">
      <div className="h-72 animate-pulse rounded-2xl bg-white" />
      <div className="h-48 animate-pulse rounded-2xl bg-white" />
      <div className="h-40 animate-pulse rounded-2xl bg-white" />
    </Container>
  );
}

async function DetailStep({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();

  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const detail = await getTransportDetail(slug);

  if (!detail) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-[20px] font-bold text-ink">Mobil tidak ditemukan</h1>
        <p className="mt-2 text-[13px] text-muted">
          Kendaraan ini tidak tersedia atau sudah tidak aktif.
        </p>
      </Container>
    );
  }

  const search: TransportDetailSearch = {
    date: query.date,
    time: query.time,
    returnDate: query.returnDate,
    returnTime: query.returnTime,
    totalDays: query.totalDays,
    driverOption: query.driverOption,
    from: query.from,
    to: query.to,
    pickup: parsePickedPoint(query.pickup),
    dropoff: parsePickedPoint(query.dropoff),
  };

  return <TransportDetailClient detail={detail} search={search} />;
}