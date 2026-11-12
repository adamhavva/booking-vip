import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import BottomTabBar from "@/components/sections/BottomTabBar";
import Container from "@/components/ui/Container";
import BackToHomeLink from "@/components/sections/BackToHomeLink";
import TourPackageEntryClient from "@/components/tour/TourPackageEntryClient";
import { getOptions, getPlaceOptions } from "@/app/actions/catalog";

export const metadata: Metadata = {
  title: "Tour Package · Booking VIP",
  description:
    "Pilih destinasi, tanggal dan jumlah penumpang, lalu bandingkan paket tour pilihan kami.",
};

/**
 * The tour entry page.
 *
 * The navbar points here: the customer picks the destination, the date and
 * the party size before the packages are shown. The packages live on
 * `/tour-package/paket`.
 */
export default function TourPackagePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white pb-20 lg:pb-0">
      <Suspense>
        <Header variant="solid" />
      </Suspense>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-hero-from via-hero-via to-hero-to py-10 md:py-14">
          <Container>
            <BackToHomeLink />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-white/60">
              Tour Package
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-white md:text-4xl">
              Liburan Terencana
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">
              Paket tour terkurasi di Indonesia — private, group, daily trip
              maupun overnight. Tentukan destinasi, tanggal dan jumlah
              penumpangnya, lalu bandingkan paketnya.
            </p>
          </Container>
        </section>

        <Container className="py-8 md:py-12">
          <Suspense fallback={<EntrySkeleton />}>
            <TourEntryStep />
          </Suspense>
        </Container>
      </main>

      <Footer />
      <BottomTabBar />
    </div>
  );
}

function EntrySkeleton() {
  return <div className="h-64 rounded-2xl border border-line bg-white" />;
}

/** The dynamic part: the destinations and the tour classes. */
async function TourEntryStep() {
  await connection();

  const [places, types] = await Promise.all([
    getPlaceOptions("destination"),
    getOptions("serviceType", "tour-package"),
  ]);

  return (
    <TourPackageEntryClient
      places={places}
      tourTypes={types.map((t) => ({ slug: t.value, name: t.label }))}
    />
  );
}
