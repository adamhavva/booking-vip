"use client";

import { useCallback } from "react";
import { listServiceTypes, reorderCatalog, setCatalogActive } from "@/app/actions/admin";
import { deleteAdminEntity } from "@/app/actions/admin-crud";
import type { AdminServiceTypeRow } from "@/types/admin";
import EntityManager from "@/components/admin/EntityManager";
import StatusToggle from "@/components/admin/StatusToggle";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList } from "@/components/admin/useAdminList";

/** Service type catalog table — sub-categories inside a service line. */
export default function ServiceTypesManager() {
  const load = useCallback(() => listServiceTypes(), []);
  const { rows, loading, error, reload } = useAdminList<AdminServiceTypeRow>(load);

  const columns = [
    {
      key: "name",
      header: "Tipe",
      render: (row: AdminServiceTypeRow) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.name}</div>
          <div className="truncate text-[11px] text-[var(--admin-muted)]">{row.slug}</div>
        </div>
      ),
    },
    {
      key: "line",
      header: "Service Line",
      render: (row: AdminServiceTypeRow) => (
        <span className="text-[12px] text-[var(--admin-muted)]">{row.lineLabel}</span>
      ),
    },
    {
      key: "products",
      header: "Produk",
      className: "text-right",
      render: (row: AdminServiceTypeRow) => (
        <span className="tabular-nums text-[var(--admin-muted)]">{row.productCount}</span>
      ),
    },
    {
      key: "order",
      header: "Urutan",
      className: "w-[76px]",
      render: (row: AdminServiceTypeRow) => (
        <span className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Naikkan urutan"
            className={`${adminClass.buttonGhost} h-7 w-7 p-0`}
            onClick={async () => {
              await reorderCatalog({ table: "serviceType", id: row.id, direction: "up" });
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
              await reorderCatalog({ table: "serviceType", id: row.id, direction: "down" });
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
      render: (row: AdminServiceTypeRow) => (
        <StatusToggle
          active={row.active}
          onChange={async (next) => {
            await setCatalogActive({ table: "serviceType", id: row.id, active: next });
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
        createHref="/admin/catalog/service-types/new"
        editHref={(row) => `/admin/catalog/service-types/${row.id}`}
        nameOf={(row) => row.name}
        itemLabel="Tipe Layanan"
        onDelete={async (row, typedName) => {
          const result = await deleteAdminEntity({
            table: "serviceType",
            id: row.id,
            confirmName: typedName,
          });
          if (result.ok) reload();
          return result;
        }}
        createLabel="Tambah Tipe Layanan"
        editLabel="Edit Tipe Layanan"
        emptyTitle="Belum ada tipe layanan"
        emptyDescription="Tambahkan sub-kategori di dalam service line."
        loading={loading}
      />
    </div>
  );
}
