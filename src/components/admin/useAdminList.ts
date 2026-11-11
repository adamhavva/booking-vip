"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Minimal data-fetching helper for the admin tables.
 *
 * The admin pages follow the same pattern as the public site: the page shell
 * stays static and the client component pulls the rows through a server
 * action. That keeps the database out of the render path.
 */
export function useAdminList<T>(
  load: () => Promise<T[]>,
): {
  rows: T[];
  loading: boolean;
  error: string;
  reload: () => void;
} {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    load()
      .then((next) => {
        if (!cancelled) setRows(next);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Gagal memuat data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [load, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { rows, loading, error, reload };
}

/**
 * The same helper for a single value (dashboard stats, reference data).
 */
export function useAdminValue<T>(
  load: () => Promise<T>,
): {
  data: T | null;
  loading: boolean;
  error: string;
  reload: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    load()
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Gagal memuat data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [load, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, reload };
}

/** Run an async admin action and report failures as a message string. */
export async function runAdminAction(
  action: () => Promise<unknown>,
): Promise<string> {
  try {
    await action();
    return "";
  } catch (err: unknown) {
    return err instanceof Error ? err.message : "Terjadi kesalahan";
  }
}
