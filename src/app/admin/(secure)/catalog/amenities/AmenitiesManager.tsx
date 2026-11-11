"use client";

import { useCallback } from "react";
import { listAmenities, upsertAmenity } from "@/app/actions/admin";
import type { AdminAmenityRow } from "@/types/admin";
import EntityManager, { type FieldSpec, type FieldValues } from "@/components/admin/EntityManager";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList } from "@/components/admin/useAdminList";

/** Amenity table — the shared feature list attached to products. */
export default function AmenitiesManager() {
  const load = useCallback(() => listAmenities(), []);
  const { rows, loading, error, reload } = useAdminList<AdminAmenityRow>(load);

  const handleSave = async (values: FieldValues, row: AdminAmenityRow | null) => {
    await upsertAmenity({
      id: row?.id,
      label: String(values.label ?? "").trim(),
    });
    reload();
  };

  const fieldsFor = (_row: AdminAmenityRow | null): FieldSpec[] => [
    { name: "label", label: "Label", kind: "text", wide: true, hint: "Contoh: With Driver" },
  ];

  const initialValuesFor = (row: AdminAmenityRow | null): FieldValues => ({
    label: row?.label ?? "",
  });

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
        fieldsFor={fieldsFor}
        initialValuesFor={initialValuesFor}
        onSave={handleSave}
        createLabel="Tambah Amenity"
        editLabel="Edit Amenity"
        emptyTitle="Belum ada amenity"
        emptyDescription="Tambahkan fitur yang bisa dipilih produk."
        loading={loading}
      />
    </div>
  );
}
