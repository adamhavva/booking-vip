"use client";

import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import Container from "@/components/ui/Container";
import MyBookingLookup from "@/components/booking/MyBookingLookup";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function MyBookingPage() {
  const { t } = useLocale();

  return (
    <>
      <Suspense>
        <Header variant="solid" />
      </Suspense>
      <main className="min-h-screen bg-canvas pt-6">
        <Container>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-ink">{t("myBooking.title")}</h1>
            <p className="text-sm text-muted">{t("myBooking.subtitle")}</p>
          </div>
          <Suspense
            fallback={
              <div className="py-12 text-center">
                <p className="text-muted">{t("common.loading")}</p>
              </div>
            }
          >
            <MyBookingLookup />
          </Suspense>
        </Container>
      </main>
      <Footer />
    </>
  );
}
