"use client";

import { useCallback } from "react";
import { listProducts, setCatalogActive } from "@/app/actions/admin";
import { deleteAdminEntity } from "@/app/actions/admin-crud";
import type { AdminProductRow } from "@/types/admin";
import EntityManager from "@/components/admin/EntityManager";
import StatusToggle from "@/components/admin/StatusToggle";
import { formatCents } from "@/components/admin/MoneyField";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList } from "@/components/admin/useAdminList";

/**
 * Product catalog table.
 *
 * Rows come from `listProducts()` (a server action) so the page shell stays
 * static; every write goes back through the admin actions.
 */
export default function ProductsManager() {
  const load = useCallback(() => listProducts(), []);
  const { rows, loading, error, reload } = useAdminList<AdminProductRow>(load);

  const columns = [
    {
      key: "title",
      header: "Produk",
      render: (row: AdminProductRow) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.title}</div>
          <div className="truncate text-[11px] text-[var(--admin-muted)]">{row.slug}</div>
        </div>
      ),
    },
    {
      key: "line",
      header: "Line",
      render: (row: AdminProductRow) => (
        <span className="text-[12px] text-[var(--admin-muted)]">{row.lineLabel}</span>
      ),
    },
    {
      key: "type",
      header: "Tipe",
      render: (row: AdminProductRow) => (
        <span className="text-[12px] text-[var(--admin-muted)]">
          {row.serviceTypeName ?? row.airportName ?? "—"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Harga",
      className: "text-right",
      render: (row: AdminProductRow) => (
        <span className="tabular-nums">
          {row.fromPriceUsdCents == null ? "—" : formatCents(row.fromPriceUsdCents)}
        </span>
      ),
    },
    {
      key: "packages",
      header: "Paket",
      className: "text-right",
      render: (row: AdminProductRow) => (
        <span className="tabular-nums text-[var(--admin-muted)]">{row.packageCount}</span>
      ),
    },
    {
      key: "active",
      header: "Status",
      className: "w-[70px]",
      render: (row: AdminProductRow) => (
        <StatusToggle
          active={row.active}
          onChange={async (next) => {
            await setCatalogActive({ table: "product", id: row.id, active: next });
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
        createHref="/admin/catalog/products/new"
        editHref={(row) => `/admin/catalog/products/${row.id}`}
        nameOf={(row) => row.title}
        itemLabel="Produk"
        onDelete={async (row, typedName) => {
          const result = await deleteAdminEntity({
            table: "product",
            id: row.id,
            confirmName: typedName,
          });
          if (result.ok) reload();
          return result;
        }}
        createLabel="Tambah Produk"
        editLabel="Edit Produk"
        emptyTitle="Belum ada produk"
        emptyDescription="Tambahkan produk pertama untuk service line ini."
        loading={loading}
      />
    </div>
  );
}
