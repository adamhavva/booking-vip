"use client";

import { useCallback } from "react";
import { listServiceLines, reorderCatalog, setCatalogActive } from "@/app/actions/admin";
import { deleteAdminEntity } from "@/app/actions/admin-crud";
import type { AdminServiceLineRow } from "@/types/admin";
import EntityManager from "@/components/admin/EntityManager";
import StatusToggle from "@/components/admin/StatusToggle";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList } from "@/components/admin/useAdminList";

/** Service line table — the four top-level service menus. */
export default function ServiceLinesManager() {
  const load = useCallback(() => listServiceLines(), []);
  const { rows, loading, error, reload } = useAdminList<AdminServiceLineRow>(load);

  const columns = [
    {
      key: "label",
      header: "Service Line",
      render: (row: AdminServiceLineRow) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.label}</div>
          <div className="truncate text-[11px] text-[var(--admin-muted)]">/{row.slug}</div>
        </div>
      ),
    },
    {
      key: "short",
      header: "Short",
      render: (row: AdminServiceLineRow) => (
        <span className="tabular-nums text-[12px] text-[var(--admin-muted)]">{row.short}</span>
      ),
    },
    {
      key: "products",
      header: "Produk",
      className: "text-right",
      render: (row: AdminServiceLineRow) => (
        <span className="tabular-nums text-[var(--admin-muted)]">{row.productCount}</span>
      ),
    },
    {
      key: "order",
      header: "Urutan",
      className: "w-[76px]",
      render: (row: AdminServiceLineRow) => (
        <span className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Naikkan urutan"
            className={`${adminClass.buttonGhost} h-7 w-7 p-0`}
            onClick={async () => {
              await reorderCatalog({ table: "serviceLine", id: row.id, direction: "up" });
              reload();
            }}
          >
            <ArrowUpIcon width={14} height={14} />
          </button>
          <button
            type="button"
            aria-label="Turunkan urutan"
            className={`${adminClass.buttonGhost} h-7 w-7 p-0`}
            onClick={async () => {
              await reorderCatalog({ table: "serviceLine", id: row.id, direction: "down" });
              reload();
            }}
          >
            <ArrowDownIcon width={14} height={14} />
          </button>
        </span>
      ),
    },
    {
      key: "active",
      header: "Status",
      className: "w-[70px]",
      render: (row: AdminServiceLineRow) => (
        <StatusToggle
          active={row.active}
          onChange={async (next) => {
            await setCatalogActive({ table: "serviceLine", id: row.id, active: next });
            reload();
          }}
        />
      ),
    },
  ];

  return (
    <div>
      {error ? (
        <p className={`${adminClass.panel} mb-4 px-3 py-2 text-[12px] text-danger`}>{error}</p>
      ) : null}
      <EntityManager
        rows={rows}
        columns={columns}
        getKey={(row) => row.id}
        createHref="/admin/catalog/service-lines/new"
        editHref={(row) => `/admin/catalog/service-lines/${row.id}`}
        nameOf={(row) => row.label}
        itemLabel="Service Line"
        onDelete={async (row, typedName) => {
          const result = await deleteAdminEntity({
            table: "serviceLine",
            id: row.id,
            confirmName: typedName,
          });
          if (result.ok) reload();
          return result;
        }}
        createLabel="Tambah Service Line"
        editLabel="Edit Service Line"
        emptyTitle="Belum ada service line"
        emptyDescription="Tambahkan menu layanan tingkat atas."
        loading={loading}
      />
    </div>
  );
}
