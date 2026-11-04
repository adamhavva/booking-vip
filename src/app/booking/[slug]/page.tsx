import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import Container from "@/components/ui/Container";
import BookingWizard from "@/components/booking/BookingWizard";

export default function BookingPage() {
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
                <p className="text-muted">Loading booking form...</p>
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
