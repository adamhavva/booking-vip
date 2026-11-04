import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import Container from "@/components/ui/Container";
import MyBookingLookup from "@/components/booking/MyBookingLookup";
import { MyBookingHeader } from "./MyBookingHeader";
import { MyBookingFallback } from "./MyBookingFallback";

export default function MyBookingPage() {
  return (
    <>
      <Suspense>
        <Header variant="solid" />
      </Suspense>
      <main className="min-h-screen bg-canvas pt-6">
        <Container>
          <MyBookingHeader />
          <Suspense fallback={<MyBookingFallback />}>
            <MyBookingLookup />
          </Suspense>
        </Container>
      </main>
      <Footer />
    </>
  );
}
