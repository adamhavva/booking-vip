"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CloseIcon } from "@/components/icons";

/**
 * Admin notifications.
 *
 * A tiny module-level store instead of a context: the admin shell stays
 * mounted across client-side navigations, so a toast published by the form
 * page is still there when the list page renders. That is what lets the
 * create/update pages report "tersimpan" while the browser is already on the
 * list again.
 */

export type AdminToastTone = "success" | "error";

export type AdminToastItem = {
  id: number;
  message: string;
  tone: AdminToastTone;
};

let nextId = 1;
let items: AdminToastItem[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

/** Publish a notification. */
export function showAdminToast(message: string, tone: AdminToastTone = "success"): void {
  const item: AdminToastItem = { id: nextId++, message, tone };
  items = [...items, item];
  notify();
}

/** Remove a notification. */
export function dismissAdminToast(id: number): void {
  items = items.filter((item) => item.id !== id);
  notify();
}

/** Subscribe a component to the notification list. */
export function useAdminToasts(): AdminToastItem[] {
  const [, bump] = useState(0);

  useEffect(() => {
    const listener = () => bump((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return items;
}

/**
 * The notification host — mounted once in the admin shell.
 *
 * Toasts disappear on their own after a few seconds; the error tone stays
 * longer because it usually carries an instruction.
 */
export function AdminToaster() {
  const toasts = useAdminToasts();

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => dismissAdminToast(toast.id), toast.tone === "error" ? 8000 : 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[13px] shadow-[0_8px_40px_rgba(16,24,40,0.12)] ${
            toast.tone === "error"
              ? "border-[var(--admin-line)] bg-white text-danger"
              : "border-[var(--admin-line)] bg-white text-[var(--admin-ink)]"
          }`}
        >
          <span
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
              toast.tone === "error" ? "text-danger" : "text-[var(--admin-accent)]"
            }`}
          >
            {toast.tone === "error" ? <CloseIcon width={12} height={12} /> : <CheckIcon width={12} height={12} />}
          </span>
          <span className="min-w-0 flex-1">{toast.message}</span>
          <button
            type="button"
            aria-label="Tutup notifikasi"
            onClick={() => dismissAdminToast(toast.id)}
            className="shrink-0 text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-ink)]"
          >
            <CloseIcon width={13} height={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
