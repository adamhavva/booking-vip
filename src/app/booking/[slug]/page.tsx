"use client";

import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import Container from "@/components/ui/Container";
import BookingWizard from "@/components/booking/BookingWizard";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function BookingPage() {
  const { t } = useLocale();

  return (
    <>
      <Suspense>
        <Header variant="solid" />
      </Suspense>
      <main className="min-h-screen bg-canvas pt-6">
        <Container>
          <Suspense
            fallback={
              <div className="py-12 text-center">
                <p className="text-muted">{t("booking.loading")}</p>
              </div>
            }
          >
            <BookingWizard />
          </Suspense>
        </Container>
      </main>
      <Footer />
    </>
  );
}
