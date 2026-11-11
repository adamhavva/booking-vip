"use client";

import { useCallback, useMemo } from "react";
import { listAmenities } from "@/app/actions/admin";
import type { AdminAmenityRow } from "@/types/admin";
import EntityFormPage from "@/components/admin/EntityFormPage";
import type { FieldSpec, FieldValues } from "@/components/admin/fields";
import { useAdminRow } from "@/components/admin/useAdminList";

const LIST_PATH = "/admin/catalog/amenities";

const getKey = (row: AdminAmenityRow) => row.id;

/**
 * The amenity form — shared by the create page and the edit page.
 *
 * Amenities are the feature list that products can be tagged with.
 */
export default function AmenitiesForm({
  mode,
  id,
}: {
  mode: "create" | "edit";
  id?: string;
}) {
  const load = useCallback(() => listAmenities(), []);
  const { row, loading: rowLoading, error: rowError, missing } = useAdminRow<AdminAmenityRow>(
    id,
    load,
    getKey
  );

  const fields = useMemo<FieldSpec[]>(
    () => [
      { name: "label", label: "Label", kind: "text", wide: true, hint: "Contoh: With Driver" },
    ],
    []
  );

  const initialValues = useMemo<FieldValues>(
    () => ({
      label: row?.label ?? "",
    }),
    [row]
  );

  return (
    <EntityFormPage
      table="amenity"
      id={id}
      title={mode === "edit" ? "Edit Amenity" : "Tambah Amenity"}
      subtitle="Amenity adalah fitur yang bisa dipilih pada produk."
      listPath={LIST_PATH}
      listLabel="Amenity"
      fields={fields}
      initialValues={initialValues}
      loading={rowLoading}
      loadError={rowError}
      rowMissing={missing}
      entityName={row?.label ?? null}
    />
  );
}
