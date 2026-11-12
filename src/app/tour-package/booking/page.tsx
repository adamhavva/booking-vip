import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import BottomTabBar from "@/components/sections/BottomTabBar";
import Container from "@/components/ui/Container";
import TourPackageBookingClient from "@/components/tour/TourPackageBookingClient";
import { getTourPackages } from "@/app/actions/catalog";
import { parsePickedPoint } from "@/lib/picked-point";

/** The query string of the tour booking step. */
type TourBookingParams = {
  pickup?: string;
  dropoff?: string;
  /** The package that was picked on the list ("slug::packageId"). */
  package?: string;
  date?: string;
  adults?: string;
  children?: string;
  infants?: string;
};

export const metadata: Metadata = {
  title: "Detail Tour Package · Booking VIP",
  description: "Isi detail perjalanan untuk pesanan tour package kamu.",
};

/**
 * Step 2 of the tour flow — the booking form.
 *
 * The route comes from the query string (the map step), so the page is
 * dynamic and reads the search parameters inside a Suspense boundary.
 */
export default function TourPackageBookingPage({
  searchParams,
}: {
  searchParams: Promise<TourBookingParams>;
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
              Tour Package · Langkah 2 dari 2
            </p>
            <h1 className="mt-1.5 text-[24px] font-bold tracking-[-0.01em] text-ink md:text-[30px]">
              Detail perjalanan
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
              Rute sudah dikonfirmasi. Pilih paket tour, jadwal, jumlah
              penumpang dan cara kami menghubungi kamu.
            </p>
          </div>

          <Suspense fallback={null}>
            <TourPackageBookingStep searchParams={searchParams} />
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
 * package list from the database.
 */
async function TourPackageBookingStep({
  searchParams,
}: {
  searchParams?: Promise<TourBookingParams>;
}) {
  // The page reads the database and the query string — render it at request
  // time instead of prerendering it.
  await connection();

  const params = searchParams ? await searchParams : {};
  const pickup = parsePickedPoint(params.pickup);
  const dropoff = parsePickedPoint(params.dropoff);
  const tours = await getTourPackages();

  if (!pickup || !dropoff) {
    // The map step still has to happen — the search travels along so the
    // package and the passenger counts are not lost.
    const forward = new URLSearchParams();
    if (params.package) forward.set("package", params.package);
    if (params.date) forward.set("date", params.date);
    if (params.adults) forward.set("adults", params.adults);
    if (params.children) forward.set("children", params.children);
    if (params.infants) forward.set("infants", params.infants);
    const query = forward.toString();

    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-8 text-center">
        <h2 className="text-[17px] font-bold text-ink">Lokasi belum dipilih</h2>
        <p className="mt-1.5 text-[13px] text-muted">
          Pilih titik berangkat dan tujuan terlebih dahulu.
        </p>
        <a
          href={`/tour-package/search${query ? `?${query}` : ""}`}
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-brand px-5 text-[13px] font-semibold text-white transition-opacity hover:bg-brand-dark"
        >
          Pilih lokasi
        </a>
      </div>
    );
  }

  return (
    <TourPackageBookingClient
      pickup={pickup}
      dropoff={dropoff}
      tours={tours}
      initial={{
        package: params.package,
        date: params.date,
        adults: params.adults ? Number(params.adults) : undefined,
        children: params.children ? Number(params.children) : undefined,
        infants: params.infants ? Number(params.infants) : undefined,
      }}
    />
  );
}
