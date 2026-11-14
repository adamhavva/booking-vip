import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import BottomTabBar from "@/components/sections/BottomTabBar";
import Container from "@/components/ui/Container";
import BackToHomeLink from "@/components/sections/BackToHomeLink";
import TransportReviewsClient from "@/components/transport/TransportReviewsClient";
import { listTransportReviews } from "@/app/actions/transport";

export const metadata: Metadata = {
  title: "Review Mobil · Booking VIP",
};

/** All reviews of one vehicle — the target of "Lihat semua". */
export default function TransportReviewsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas pb-20 lg:pb-0">
      <Suspense>
        <Header variant="solid" />
      </Suspense>
      <main className="flex-1">
        <Container className="py-6 md:py-8">
          <BackToHomeLink />
          <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-2xl bg-white" />}>
            <ReviewsStep params={params} />
          </Suspense>
        </Container>
      </main>
      <Footer />
      <BottomTabBar />
    </div>
  );
}

async function ReviewsStep({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const reviews = await listTransportReviews(slug);
  return <TransportReviewsClient slug={slug} reviews={reviews} />;
}