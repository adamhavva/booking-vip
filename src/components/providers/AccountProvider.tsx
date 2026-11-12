"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
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

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AccountOverviewContext.Provider value={{ overview, loading, refresh }}>
      {children}
    </AccountOverviewContext.Provider>
  );
}

/** Read the shared overview. The provider is mounted in the root layout. */
export function useAccountOverview(): AccountOverviewState {
  const value = useContext(AccountOverviewContext);
  if (!value) {
    throw new Error("useAccountOverview must be used inside AccountProvider");
  }
  return value;
}
