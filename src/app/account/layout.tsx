import { Suspense } from "react";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import Container from "@/components/ui/Container";
import AccountShell from "@/components/account/AccountShell";
import { Toaster } from "@/components/ui/toast";
import { getUserSession } from "@/lib/user/session";

// The gate reads the session cookie and redirects guests — a request read
// that can't be part of a static shell, so the area blocks on the server.
export const instant = false;

/**
 * The account shell.
 *
 * The header and the footer are exactly the ones of the public site, so the
 * account area feels like a normal part of the site. The background is white
 * — the same clean surface as the rest of the pages.
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense>
        <Header variant="solid" />
      </Suspense>
      <main className="min-h-screen bg-white">
        <Container className="py-8 md:py-12">
          <Suspense fallback={null}>
            <AccountGate>
              <AccountShell>{children}</AccountShell>
            </AccountGate>
          </Suspense>
        </Container>
      </main>
      <Footer />
      <Toaster />
    </>
  );
}

/**
 * The account gate — only a signed-in customer reaches the account area.
 *
 * The check lives in its own component so it can be wrapped in a Suspense
 * boundary (the session cookie makes the render dynamic).
 */
async function AccountGate({ children }: { children: ReactNode }) {
  await connection();

  const session = await getUserSession();
  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}
