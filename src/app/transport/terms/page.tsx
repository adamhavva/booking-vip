import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import BottomTabBar from "@/components/sections/BottomTabBar";
import Container from "@/components/ui/Container";
import BackToHomeLink from "@/components/sections/BackToHomeLink";
import TransportTermsClient from "@/components/transport/TransportTermsClient";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan Sewa Mobil · Booking VIP",
};

/** The rental terms & conditions page. */
export default function TransportTermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas pb-20 lg:pb-0">
      <Suspense>
        <Header variant="solid" />
      </Suspense>
      <main className="flex-1">
        <Container className="py-6 md:py-8">
          <BackToHomeLink />
          <TransportTermsClient />
        </Container>
      </main>
      <Footer />
      <BottomTabBar />
    </div>
  );
}