"use client";

import { useCallback } from "react";
import { listAmenities } from "@/app/actions/admin";
import { deleteAdminEntity } from "@/app/actions/admin-crud";
import type { AdminAmenityRow } from "@/types/admin";
import EntityManager from "@/components/admin/EntityManager";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList } from "@/components/admin/useAdminList";

/** Amenity table — the shared feature list attached to products. */
export default function AmenitiesManager() {
  const load = useCallback(() => listAmenities(), []);
  const { rows, loading, error, reload } = useAdminList<AdminAmenityRow>(load);

  const columns = [
    {
      key: "label",
      header: "Amenity",
      render: (row: AdminAmenityRow) => <span className="font-medium">{row.label}</span>,
    },
    {
      key: "products",
      header: "Dipakai Produk",
      className: "text-right",
      render: (row: AdminAmenityRow) => (
        <span className="tabular-nums text-[var(--admin-muted)]">{row.productCount}</span>
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
        createHref="/admin/catalog/amenities/new"
        editHref={(row) => `/admin/catalog/amenities/${row.id}`}
        nameOf={(row) => row.label}
        itemLabel="Amenity"
        onDelete={async (row, typedName) => {
          const result = await deleteAdminEntity({
            table: "amenity",
            id: row.id,
            confirmName: typedName,
          });
          if (result.ok) reload();
          return result;
        }}
        createLabel="Tambah Amenity"
        editLabel="Edit Amenity"
        emptyTitle="Belum ada amenity"
        emptyDescription="Tambahkan fitur yang bisa dipilih produk."
        loading={loading}
      />
    </div>
  );
}
