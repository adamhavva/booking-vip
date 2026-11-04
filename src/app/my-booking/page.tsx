import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import Container from "@/components/ui/Container";
import MyBookingLookup from "@/components/booking/MyBookingLookup";

export default function MyBookingPage() {
  return (
    <>
      <Suspense>
        <Header variant="solid" />
      </Suspense>
      <main className="min-h-screen bg-canvas pt-6">
        <Container>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-ink">My Booking</h1>
            <p className="text-sm text-muted">
              Look up your booking using your code and email
            </p>
          </div>
          <Suspense
            fallback={
              <div className="py-12 text-center">
                <p className="text-muted">Loading...</p>
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
