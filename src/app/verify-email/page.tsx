import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import Container from "@/components/ui/Container";
import VerifyEmailClient from "@/components/account/VerifyEmailClient";

export const metadata: Metadata = {
  title: "Verifikasi Email · Booking VIP",
  description: "Selesaikan verifikasi email akun Booking VIP kamu.",
  robots: { index: false, follow: false },
};

/**
 * The email verification landing page.
 *
 * The page is public — the link in the mail is the proof, exactly like the
 * password reset flow. It reads the query string inside a Suspense boundary
 * (a URL read outside one is a build error under `cacheComponents`).
 */
export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ oobCode?: string; email?: string; sent?: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Suspense>
        <Header variant="solid" />
      </Suspense>

      <main className="flex flex-1 items-center bg-white">
        <Container className="py-10 md:py-16">
          <Suspense fallback={<VerifySkeleton />}>
            <VerifyStep searchParams={searchParams} />
          </Suspense>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

function VerifySkeleton() {
  return (
    <div className="mx-auto w-full max-w-[460px] rounded-2xl border border-line bg-white p-6 md:p-8">
      <div className="h-11 w-11 rounded-xl bg-brand-soft" />
      <div className="mt-4 h-6 w-48 rounded-lg bg-canvas" />
      <div className="mt-3 h-4 w-full rounded-lg bg-canvas" />
    </div>
  );
}

/** The dynamic part: the code (or the address) from the query string. */
async function VerifyStep({
  searchParams,
}: {
  searchParams: Promise<{ oobCode?: string; email?: string; sent?: string }>;
}) {
  await connection();

  const params = await searchParams;

  return (
    <VerifyEmailClient
      oobCode={params.oobCode ?? null}
      email={params.email ?? null}
      sent={params.sent === "1"}
    />
  );
}
