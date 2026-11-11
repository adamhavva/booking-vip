"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons";
import { adminClass } from "./tokens";

/**
 * Side drawer used for every admin edit form.
 *
 * Closes on Escape or on an overlay click. The footer (Cancel / Save) is
 * sticky so long forms always keep their actions in reach.
 */
export default function AdminDrawer({
  open,
  title,
  description,
  onClose,
  onSave,
  saving,
  saveLabel = "Simpan",
  error,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
  error?: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/20"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`${adminClass.drawer} animate-[fadeIn_120ms_ease-out]`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--admin-line)] px-6 py-5">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-[12px] text-[var(--admin-muted)]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className={`${adminClass.buttonGhost} -mr-2 -mt-1`}
          >
            <CloseIcon width={16} height={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        <footer className="flex items-center justify-between gap-3 border-t border-[var(--admin-line)] px-6 py-4">
          <span className="min-w-0 flex-1 truncate text-[12px] text-danger">{error ?? ""}</span>
          <button
            type="button"
            onClick={onClose}
            className={adminClass.buttonSecondary}
            disabled={saving}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSave}
            className={adminClass.buttonPrimary}
            disabled={saving}
          >
            {saving ? "Menyimpan…" : saveLabel}
          </button>
        </footer>
      </aside>
    </div>
  );
}
