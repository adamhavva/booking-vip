"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getAccountOverview, type AccountOverviewDTO } from "@/app/actions/account";

/**
 * Who is signed in, read once per page load.
 *
 * The session cookie is HttpOnly, so the browser has to ask the server
 * through a server action. The header menu, the account sidebar and the
 * account panels all want the same row (name, tier, points), so the provider
 * is mounted at the root and they share one read instead of each asking
 * again. A guest simply gets `overview: null`. `refresh` is for the forms
 * that change the row, such as the profile editor.
 *
 * Sign-in (password or Google) ends in a server-action `redirect`, which is
 * a *client-side* navigation: this provider stays mounted with the guest
 * overview it read before the cookie existed. So whenever the pathname
 * changes while no account is held, the overview is re-read — that is what
 * swaps the header to the initials menu right after signing in, without a
 * page reload. For a guest the re-read is a cheap null (no cookie, no
 * Firebase verification); once an account is held, navigation never re-reads.
 */

type AccountOverviewState = {
  overview: AccountOverviewDTO | null;
  loading: boolean;
  refresh: () => Promise<AccountOverviewDTO | null>;
};

const AccountOverviewContext = createContext<AccountOverviewState | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [overview, setOverview] = useState<AccountOverviewDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getAccountOverview();
      setOverview(data);
      return data;
    } catch {
      // The panels render their empty state when the read fails.
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AccountOverviewContext.Provider value={{ overview, loading, refresh }}>
      {/* The pathname read lives behind a Suspense boundary: under
          `cacheComponents` a URL read outside one blocks prerendering. */}
      <Suspense fallback={null}>
        <RefreshOnNavigation overview={overview} refresh={refresh} />
      </Suspense>
      {children}
    </AccountOverviewContext.Provider>
  );
}

/**
 * Re-read the overview on every client-side navigation that happens while
 * no account is held — notably the redirect that ends a sign-in, which keeps
 * this provider mounted with its stale guest overview. Also covers the
 * initial load. For a guest the re-read is a cheap null; once an account is
 * held, navigation never re-reads.
 */
function RefreshOnNavigation({
  overview,
  refresh,
}: {
  overview: AccountOverviewDTO | null;
  refresh: () => Promise<AccountOverviewDTO | null>;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!overview) void refresh();
  }, [pathname, overview, refresh]);

  return null;
}

/** Read the shared overview. The provider is mounted in the root layout. */
export function useAccountOverview(): AccountOverviewState {
  const value = useContext(AccountOverviewContext);
  if (!value) {
    throw new Error("useAccountOverview must be used inside AccountProvider");
  }
  return value;
}
