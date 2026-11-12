import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import BottomTabBar from "@/components/sections/BottomTabBar";
import Container from "@/components/ui/Container";
import EvoaApplyForm from "@/components/evoa/EvoaApplyForm";
import { getEvoaHowItWorks } from "@/lib/evoa";
import { getUserSession } from "@/lib/user/session";

export const metadata: Metadata = {
  title: "Pengajuan e-VOA · Booking VIP",
  description:
    "Ajukan e-VOA lewat kami — kami tangani pengajuannya, kamu tinggal menunggu.",
};

/**
 * The e-VOA application form.
 *
 * e-VOA here is a *service*: the customer gives us the passport data of the
 * person the visa is for and we handle the application.
 */
export default function EvoaApplyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white pb-20 lg:pb-0">
      <Suspense>
        <Header variant="solid" />
      </Suspense>

      <main className="flex-1">
        <Container className="py-8 md:py-12">
          <div className="mb-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              e-VOA · Pengajuan visa
            </p>
            <h1 className="mt-1.5 text-[24px] font-bold tracking-[-0.01em] text-ink md:text-[30px]">
              Ajukan visa untuk orang lain
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
              Kami menangani pengajuan e-VOA untuk kamu. Isi data paspor, kirim,
              dan kami lanjutkan prosesnya.
            </p>
          </div>

          <Suspense fallback={null}>
            <EvoaApplySection />
          </Suspense>
        </Container>
      </main>

      <Footer />
      <BottomTabBar />
    </div>
  );
}

/**
 * The dynamic part of the page: the copy from the database and the session
 * check (the form can only be submitted by a signed-in customer).
 */
async function EvoaApplySection() {
  await connection();

  const [steps, session] = await Promise.all([
    getEvoaHowItWorks(),
    getUserSession(),
  ]);

  if (!session) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-8 text-center">
        <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink">
          Masuk dulu, ya
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Pengajuan visa butuh akun supaya nomor pengajuannya bisa kamu pantau
          di halaman Pesanan.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-brand px-6 text-[13px] font-semibold text-white transition-opacity hover:bg-brand-dark"
        >
          Masuk
        </Link>
      </div>
    );
  }

  return <EvoaApplyForm steps={steps} />;
}
