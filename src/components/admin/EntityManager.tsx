"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import DataTable, { type Column } from "./DataTable";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { adminClass } from "./tokens";
import { showAdminToast } from "./toast";
import type { AdminDeleteResult } from "@/app/actions/admin-crud";

/**
 * The generic admin table.
 *
 * Every catalog page describes its own rows and columns and plugs in the
 * routes of its create and edit pages:
 *
 *   - **Create** and **Edit** are links — they open a dedicated page, never
 *     a drawer or a modal.
 *   - **Delete** opens the confirmation modal, which only lets the operator
 *     through after the exact name has been typed.
 */
export default function EntityManager<T>({
  rows,
  columns,
  getKey,
  createHref,
  editHref,
  onDelete,
  nameOf,
  itemLabel = "Data",
  createLabel,
  editLabel,
  emptyTitle,
  emptyDescription,
  headerExtra,
  loading,
}: {
  rows: T[];
  columns: Column<T>[];
  getKey: (row: T) => string;
  /** The dedicated "create" page of this module. */
  createHref: string;
  /** The dedicated "edit" page of a row. */
  editHref: (row: T) => string;
  /** Optional delete handler — the typed name is passed for the server check. */
  onDelete?: (row: T, typedName: string) => Promise<AdminDeleteResult>;
  /** The exact name the operator has to type to confirm a deletion. */
  nameOf: (row: T) => string;
  /** What is being managed — used in the delete modal sentences. */
  itemLabel?: string;
  createLabel: string;
  editLabel: string;
  emptyTitle?: string;
  emptyDescription?: string;
  headerExtra?: ReactNode;
  loading?: boolean;
}) {
  const [pending, setPending] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const closeModal = () => {
    if (deleting) return;
    setPending(null);
    setDeleteError("");
  };

  const handleDelete = async (typedName: string) => {
    if (!pending || !onDelete || deleting) return;

    setDeleting(true);
    setDeleteError("");
    try {
      const result = await onDelete(pending, typedName);
      if (!result.ok) {
        setDeleteError(result.error);
        return;
      }
      showAdminToast(result.message);
      setPending(null);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus data");
    } finally {
      setDeleting(false);
    }
  };

  const actionColumn: Column<T> = {
    key: "__actions",
    header: "",
    className: "w-[92px] text-right",
    render: (row) => (
      <span className="flex items-center justify-end gap-1">
        <Link
          href={editHref(row)}
          aria-label={editLabel}
          title={editLabel}
          className={`${adminClass.buttonGhost} h-8 w-8 p-0`}
        >
          <PencilIcon width={15} height={15} />
        </Link>
        {onDelete ? (
          <button
            type="button"
            onClick={() => {
              setDeleteError("");
              setPending(row);
            }}
            aria-label="Hapus"
            title="Hapus"
            className={`${adminClass.buttonGhost} h-8 w-8 p-0 text-danger`}
          >
            <TrashIcon width={15} height={15} />
          </button>
        ) : null}
      </span>
    ),
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={createHref} className={adminClass.buttonPrimary}>
            <PlusIcon width={14} height={14} className="mr-1.5" />
            {createLabel}
          </Link>
          {headerExtra}
        </div>
      </div>

      <div className={adminClass.panel}>
        {loading ? (
          <p className="px-6 py-10 text-center text-[13px] text-[var(--admin-muted)]">Memuat…</p>
        ) : (
          <DataTable
            columns={[...columns, actionColumn]}
            rows={rows}
            getKey={getKey}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            emptyAction={
              <Link href={createHref} className={adminClass.buttonSecondary}>
                {createLabel}
              </Link>
            }
          />
        )}
      </div>

      <DeleteConfirmModal
        open={pending !== null}
        name={pending ? nameOf(pending) : ""}
        itemLabel={itemLabel}
        deleting={deleting}
        error={deleteError}
        onCancel={closeModal}
        onConfirm={handleDelete}
      />
    </div>
  );
}
