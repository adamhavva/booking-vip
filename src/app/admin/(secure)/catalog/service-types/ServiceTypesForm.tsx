"use client";

import { useCallback, useMemo } from "react";
import { getAdminReferenceData, listServiceTypes } from "@/app/actions/admin";
import type { AdminReferenceData, AdminServiceTypeRow } from "@/types/admin";
import EntityFormPage from "@/components/admin/EntityFormPage";
import type { FieldSpec, FieldValues } from "@/components/admin/fields";
import { useAdminRow, useAdminValue } from "@/components/admin/useAdminList";

const LIST_PATH = "/admin/catalog/service-types";

const getKey = (row: AdminServiceTypeRow) => row.id;

/**
 * The service type form — shared by the create page and the edit page.
 *
 * A service type is a sub-category inside a service line.
 */
export default function ServiceTypesForm({
  mode,
  id,
}: {
  mode: "create" | "edit";
  id?: string;
}) {
  const load = useCallback(() => listServiceTypes(), []);
  const { row, loading: rowLoading, error: rowError, missing } = useAdminRow<AdminServiceTypeRow>(
    id,
    load,
    getKey
  );

  const reference = useCallback(() => getAdminReferenceData(), []);
  const { data: refs, loading: refsLoading } = useAdminValue<AdminReferenceData>(reference);

  const fields = useMemo<FieldSpec[]>(
    () => [
      { name: "name", label: "Nama", kind: "text" },
      { name: "slug", label: "Slug", kind: "text", hint: "Unik per service line" },
      { name: "lineId", label: "Service Line", kind: "select", options: refs?.lines ?? [] },
      { name: "sortOrder", label: "Urutan", kind: "number" },
      { name: "active", label: "Aktif", kind: "toggle" },
    ],
    [refs]
  );

  const initialValues = useMemo<FieldValues>(
    () => ({
      name: row?.name ?? "",
      slug: row?.slug ?? "",
      lineId: row?.lineId ?? refs?.lines[0]?.value ?? "",
      sortOrder: row?.sortOrder ?? 0,
      active: row?.active ?? true,
    }),
    [row, refs]
  );

  return (
    <EntityFormPage
      table="serviceType"
      id={id}
      title={mode === "edit" ? "Edit Tipe Layanan" : "Tambah Tipe Layanan"}
      subtitle="Tipe layanan adalah sub-kategori di dalam service line."
      listPath={LIST_PATH}
      listLabel="Tipe Layanan"
      fields={fields}
      initialValues={initialValues}
      loading={rowLoading || refsLoading}
      loadError={rowError}
      rowMissing={missing}
      entityName={row?.name ?? null}
    />
  );
}
