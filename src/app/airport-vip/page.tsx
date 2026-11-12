import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import BottomTabBar from "@/components/sections/BottomTabBar";
import Container from "@/components/ui/Container";
import AirportVipWizard from "@/components/airport-vip/AirportVipWizard";
import {
  getBookingRules,
  getServiceInfo,
  listWizardAirports,
  listWizardAirlines,
  listWizardCountries,
  listWizardServices,
} from "@/lib/airport-vip";

export const metadata: Metadata = {
  title: "Airport VIP Service · Booking VIP",
  description:
    "Pesan layanan Airport VIP Service — fast track, meet & assist, dan layanan FRA yang kami tangani.",
};

/**
 * The airport VIP booking tool.
 *
 * The flow mirrors the Asia Fast Track booking tool (country → airport →
 * schedule → flight → service → passenger → confirm), but the layout is our
 * own. The country narrows the airports, exactly as it does there.
 */
export default function AirportVipPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white pb-20 lg:pb-0">
      <Suspense>
        <Header variant="solid" />
      </Suspense>

      <main className="flex-1">
        <Container className="py-8 md:py-12">
          <div className="mb-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Airport VIP Service
            </p>
            <h1 className="mt-1.5 text-[24px] font-bold tracking-[-0.01em] text-ink md:text-[30px]">
              Booking Airport VIP Service
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
              Tujuh langkah singkat: pilih negara, bandara, jadwal, penerbangan,
              layanan, data penumpang, lalu konfirmasi.
            </p>
          </div>

          <Suspense fallback={null}>
            <AirportVipSection />
          </Suspense>
        </Container>
      </main>

      <Footer />
      <BottomTabBar />
    </div>
  );
}

/**
 * The dynamic part of the page: the airports, airlines and services are read
 * from the database, so the section is rendered per request.
 */
async function AirportVipSection() {
  await connection();

  const [countries, airports, airlines, services, rules, serviceInfo] =
    await Promise.all([
      listWizardCountries(),
      listWizardAirports(),
      listWizardAirlines(),
      listWizardServices(),
      getBookingRules(),
      getServiceInfo(),
    ]);

  return (
    <AirportVipWizard
      countries={countries}
      airports={airports}
      airlines={airlines}
      services={services}
      rules={rules}
      serviceInfo={serviceInfo}
    />
  );
}
