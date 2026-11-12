"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AccountNav from "@/components/account/AccountNav";

/**
 * The two-column frame of the account area.
 *
 * The sidebar lives here instead of in every panel, so each account page is
 * just its own content and the navigation stays identical across the area.
 * The identity card reads the overview the root provider already holds.
 */
export default function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // The invoice is a printable sheet — it gets the page to itself.
  const bare = pathname.endsWith("/invoice");

  if (bare) {
    return <>{children}</>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <AccountNav active={pathname} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
