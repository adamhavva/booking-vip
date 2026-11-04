import Link from "next/link";
import { Suspense } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import BottomTabBar from "@/components/sections/BottomTabBar";
import BookingPanel from "@/components/sections/BookingPanel";
import Footer from "@/components/sections/Footer";
import ServiceCatalog from "@/components/sections/ServiceCatalog";
import ServiceSearchSection from "@/components/sections/ServiceSearchSection";
import type { ServicePage } from "@/types";

/**
 * Shared shell for the service sub-pages: sticky header (with the navbar),
 * a simple hero band, the product catalog, a booking panel, and the footer.
 */
export default function ServiceLayout({ service }: { service: ServicePage }) {
  return (
    <div className="flex min-h-screen flex-col bg-white pb-20 lg:pb-0">
      <Header variant="solid" />

      <main className="flex-1">
        {/* Hero band */}
        <section className="bg-gradient-to-b from-hero-from via-hero-via to-hero-to py-12 md:py-16">
          <Container>
            <Link
              href="/"
              className="text-sm font-semibold text-white/70 hover:text-white"
            >
              &larr; Back to home
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-white/60">
              {service.eyebrow}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-white md:text-4xl">
              {service.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">
              {service.intro}
            </p>
          </Container>
        </section>

        {/* Copy + booking panel */}
        <Container className="py-10 md:py-14">
          <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
            <div className="space-y-8">
              {service.sections.map((s) => (
                <div key={s.heading}>
                  <h2 className="text-lg font-extrabold text-ink md:text-xl">
                    {s.heading}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted md:text-base">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>

            <Suspense
              fallback={<BookingPanel service={service} />}
            >
              <ServiceSearchSection service={service} />
            </Suspense>
          </div>
        </Container>

        {/* Product catalog */}
        <ServiceCatalog kind={service.catalog} tabs={service.tabs} />
      </main>

      <Footer />
      <BottomTabBar />
    </div>
  );
}
