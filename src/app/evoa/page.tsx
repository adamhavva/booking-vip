import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import ServiceLayout from "@/components/sections/ServiceLayout";
import ServiceLayoutSkeleton from "@/components/sections/ServiceLayoutSkeleton";
import { getServiceLineContent } from "@/app/actions/content";
import { toServicePage } from "@/lib/servicePage";
import { servicePages } from "@/data/services";

const fallback = servicePages["evoa"];

export const metadata: Metadata = {
  title: `${fallback.title} - Booking VIP`,
  description: fallback.intro,
};

/**
 * The eVOA index.
 *
 * The copy comes from the `ServiceLine` row inside a Suspense boundary; the
 * application call-to-action below is fixed copy of the page itself.
 */
export default function EvoaPage() {
  return (
    <>
      <Suspense fallback={<ServiceLayoutSkeleton />}>
        <EvoaBody />
      </Suspense>

      {/* The visa application service */}
      <section className="border-t border-line bg-canvas/50 py-10 md:py-14">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-white p-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-[18px] font-bold tracking-[-0.01em] text-ink">
                Ajukan visa, kami yang tangani
              </h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">
                Isi data paspor orang yang akan memakai visa. Kami kirim
                pengajuannya dan nomor pengajuan langsung muncul di akun kamu.
              </p>
            </div>
            <Link
              href="/evoa/apply"
              className="inline-flex h-11 shrink-0 items-center rounded-xl bg-brand px-6 text-[14px] font-semibold text-white transition-opacity hover:bg-brand-dark"
            >
              Pengajuan e-VOA
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

async function EvoaBody() {
  await connection();

  const line = await getServiceLineContent("evoa");
  return <ServiceLayout service={toServicePage("evoa", line)} />;
}
