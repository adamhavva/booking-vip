import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import Container from "@/components/ui/Container";
import BookingWizard from "@/components/booking/BookingWizard";
import { getProduct } from "@/app/actions/catalog";

export const instant = false;

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch product to get airport name for the wizard
  const product = await getProduct(slug);
  const airportName = product?.placeLabel ?? "";

  return (
    <>
      <Header variant="solid" />
      <main className="min-h-screen bg-canvas pt-6">
        <Container>
          <Suspense
            fallback={
              <div className="py-12 text-center">
                <p className="text-muted">Loading booking form...</p>
              </div>
            }
          >
            <BookingWizard airportName={airportName} />
          </Suspense>
        </Container>
      </main>
      <Footer />
    </>
  );
}
