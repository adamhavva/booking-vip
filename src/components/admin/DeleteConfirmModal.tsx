"use client";

import { useEffect, useId, useRef, useState } from "react";
import { adminClass } from "./tokens";

/**
 * Delete confirmation modal.
 *
 * The operator must retype the exact name of the record before the delete
 * button unlocks — the comparison is a strict, character-for-character match
 * (no trimming, no case folding), so `"hotel"` never unlocks `"Hotel "`.
 * The server repeats the same comparison before it deletes anything.
 */
export default function DeleteConfirmModal({
  open,
  name,
  itemLabel = "data",
  deleting,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  /** The exact name of the record that will be deleted. */
  name: string;
  /** What is being deleted, used in the sentences ("Produk", "Paket", …). */
  itemLabel?: string;
  deleting?: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: (typedName: string) => void;
}) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // A unique id keeps the label pointing at the right input, even when a
  // previously opened modal is still cached in the document.
  const uid = useId();
  const inputId = `delete-confirm-name-${uid}`;

  // Every time the modal opens it starts from an empty input.
  useEffect(() => {
    if (open) setTyped("");
  }, [open, name]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, deleting, onCancel]);

  if (!open) return null;

  const matches = typed.length > 0 && typed === name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        onClick={deleting ? undefined : onCancel}
        className="absolute inset-0 h-full w-full cursor-default bg-black/30"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Confirm Delete"
        className="relative w-full max-w-[440px] rounded-lg border border-[var(--admin-line)] bg-white shadow-[0_8px_40px_rgba(16,24,40,0.16)]"
      >
        <header className="border-b border-[var(--admin-line)] px-5 py-4">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Confirm Delete</h2>
        </header>

        <div className="px-5 py-4">
          <p className="text-[13px] leading-relaxed text-[var(--admin-ink)]">
            Tindakan ini <strong>tidak dapat dibatalkan</strong>. {itemLabel} akan dihapus permanen
            dari database.
          </p>

          <div className="mt-3 rounded-lg border border-[var(--admin-line)] bg-[var(--admin-hover)] px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--admin-muted)]">
              {itemLabel} yang akan dihapus
            </p>
            <p className="mt-0.5 break-all text-[13px] font-medium">{name}</p>
          </div>

          <label className="mt-4 block" htmlFor={inputId}>
            <span className={`mb-1.5 block ${adminClass.label}`}>
              Type the name to confirm deletion
            </span>
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              value={typed}
              placeholder="Enter the exact name"
              autoComplete="off"
              spellCheck={false}
              disabled={deleting}
              onChange={(e) => setTyped(e.target.value)}
              className={adminClass.input}
            />
          </label>

          <p className="mt-2 text-[11px] text-[var(--admin-muted)]">
            Ketik nama persis seperti di atas (huruf besar-kecil dan spasi harus sama).
          </p>

          {error ? (
            <p className="mt-3 rounded-lg border border-[var(--admin-line)] px-3 py-2 text-[12px] text-danger">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-[var(--admin-line)] px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className={adminClass.buttonSecondary}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(typed)}
            disabled={!matches || deleting}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-danger px-3 text-[13px] font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? "Menghapus…" : "Delete Permanently"}
          </button>
        </footer>
      </div>
    </div>
  );
}
