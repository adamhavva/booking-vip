"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CloseIcon } from "@/components/icons";

/**
 * Customer-area notifications.
 *
 * A tiny module-level store (no context) so a toast published by a form is
 * still there when the page navigates. The tone decides how long the toast
 * stays: a success disappears quickly, an error stays longer because it
 * usually carries an instruction.
 */

export type ToastTone = "success" | "error";

export type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

let nextId = 1;
let items: ToastItem[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

/** Publish a notification. */
export function showToast(message: string, tone: ToastTone = "success"): void {
  const item: ToastItem = { id: nextId++, message, tone };
  items = [...items, item];
  notify();
}

/** Remove a notification. */
export function dismissToast(id: number): void {
  items = items.filter((item) => item.id !== id);
  notify();
}

/** Subscribe a component to the notification list. */
export function useToasts(): ToastItem[] {
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

/** The notification host — mounted once in the account layout. */
export function Toaster() {
  const toasts = useToasts();

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => dismissToast(toast.id), toast.tone === "error" ? 8000 : 4000),
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
          className="pointer-events-auto flex items-start gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] shadow-[0_8px_40px_rgba(16,24,40,0.12)]"
        >
          <span
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
              toast.tone === "error" ? "text-danger" : "text-brand"
            }`}
          >
            {toast.tone === "error" ? (
              <CloseIcon width={12} height={12} />
            ) : (
              <CheckIcon width={12} height={12} />
            )}
          </span>
          <span className="min-w-0 flex-1 text-ink">{toast.message}</span>
          <button
            type="button"
            aria-label="Tutup notifikasi"
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 text-muted transition-colors hover:text-ink"
          >
            <CloseIcon width={13} height={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
