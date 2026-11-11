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

/**
 * Load a single row of a catalog list.
 *
 * The admin pages never read the database during render — the list actions
 * return the whole table and the row is picked from it. `id` is undefined in
 * create mode, in which case nothing is loaded.
 */
export function useAdminRow<T>(
  id: string | undefined,
  load: () => Promise<T[]>,
  getKey: (row: T) => string,
): {
  row: T | null;
  loading: boolean;
  error: string;
  /** True when the row was requested but does not exist (anymore). */
  missing: boolean;
} {
  const [row, setRow] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!id) {
      setRow(null);
      setLoading(false);
      setMissing(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    setMissing(false);

    load()
      .then((rows) => {
        if (cancelled) return;
        const found = rows.find((item) => getKey(item) === id);
        setRow(found ?? null);
        setMissing(!found);
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
  }, [id, load, getKey]);

  return { row, loading, error, missing };
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
