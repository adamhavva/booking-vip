import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import AuthShell from "@/components/auth/AuthShell";
import { getUserSession } from "@/lib/user/session";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Daftar · Booking VIP",
  description: "Buat akun Booking VIP kamu.",
};

/**
 * Customer registration.
 *
 * New accounts always start as plain users; the admin role is only granted
 * through the admin area, never from this form.
 *
 * Like the login page this is a split-screen step without header/footer.
 */
export default async function RegisterPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <AlreadySignedIn />
      </Suspense>
      <RegisterForm />
    </AuthShell>
  );
}

/** Sends an already-authenticated customer straight to their bookings. */
async function AlreadySignedIn() {
  await connection();

  const session = await getUserSession();
  if (session) {
    redirect("/my-booking");
  }
  return null;
}
