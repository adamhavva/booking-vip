import type { Metadata } from "next";
import Link from "next/link";
import ServiceLayout from "@/components/sections/ServiceLayout";
import { servicePages } from "@/data/services";

const service = servicePages["transport"];

export const metadata: Metadata = {
  title: `${service.title} - Booking VIP`,
  description: service.intro,
};

export default function TransportPage() {
  return (
    <>
      <ServiceLayout service={service} />

      {/* The map-first transport flow */}
      <section className="border-t border-line bg-canvas/50 py-10 md:py-14">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-white p-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-[18px] font-bold tracking-[-0.01em] text-ink">
                Pesan dengan peta
              </h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">
                Tentukan titik pickup dan dropoff di peta, gunakan "lokasi saya",
                lalu konfirmasi rute sebelum mengisi detail perjalanan.
              </p>
            </div>
            <Link
              href="/transport/pickup"
              className="inline-flex h-11 shrink-0 items-center rounded-xl bg-brand px-6 text-[14px] font-semibold text-white transition-opacity hover:bg-brand-dark"
            >
              Pesan Transport
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
