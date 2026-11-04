import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import BottomTabBar from "@/components/sections/BottomTabBar";
import ProductDetail from "@/components/sections/ProductDetail";

export const metadata: Metadata = {
  title: "eVOA Details - Booking VIP",
};

export default function EvoaDetailPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white pb-20 lg:pb-0">
      <Suspense>
        <Header variant="solid" />
      </Suspense>
      <main className="flex-1">
        <Suspense>
          <ProductDetail lineSlug="evoa" />
        </Suspense>
      </main>
      <Footer />
      <BottomTabBar />
    </div>
  );
}
