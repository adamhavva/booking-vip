import { Suspense } from "react";
import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import BottomTabBar from "@/components/sections/BottomTabBar";
import Footer from "@/components/sections/Footer";
import SearchResults from "@/components/sections/SearchResults";

export const metadata: Metadata = {
  title: "Search - Booking VIP",
  description: "Search VIP services, transport, tours, eVOA and promos.",
};

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white pb-20 lg:pb-0">
      <Header variant="solid" />

      <main className="flex-1">
        <Suspense
          fallback={
            <Container className="py-8">
              <p className="text-sm text-muted">Searching…</p>
            </Container>
          }
        >
          <SearchResults />
        </Suspense>
      </main>

      <Footer />
      <BottomTabBar />
    </div>
  );
}
