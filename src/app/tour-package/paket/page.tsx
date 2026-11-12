import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import BottomTabBar from "@/components/sections/BottomTabBar";
import Container from "@/components/ui/Container";
import TourPackageListClient, {
  type TourPackageSearch,
} from "@/components/tour/TourPackageListClient";
import { getTourPackageGroups } from "@/app/actions/catalog";

export const metadata: Metadata = {
  title: "Paket Tour · Booking VIP",
  description: "Daftar paket tour yang bisa dipesan beserta harganya.",
};

/**
 * The package list — the result of "Cari paket" on the tour entry page.
 */
export default function TourPackageListPage({
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
              Tour Package
            </p>
            <h1 className="mt-1.5 text-[24px] font-bold tracking-[-0.01em] text-ink md:text-[30px]">
              Pilihan paket tour
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
              Harga di bawah sudah dihitung untuk jumlah penumpang yang kamu
              pilih.
            </p>
          </div>

          <Suspense fallback={<ListSkeleton />}>
            <PackageStep searchParams={searchParams} />
          </Suspense>
        </Container>
      </main>

      <Footer />
      <BottomTabBar />
    </div>
  );
}

function ListSkeleton() {
  return <div className="h-64 rounded-2xl border border-line bg-white" />;
}

/** The dynamic part: the query string and the packages from the database. */
async function PackageStep({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();

  const params = await searchParams;
  const groups = await getTourPackageGroups();

  const search: TourPackageSearch = {
    destination: params.destination,
    date: params.date,
    adults: params.adults,
    children: params.children,
    infants: params.infants,
    type: params.type,
  };

  return <TourPackageListClient groups={groups} search={search} />;
}
