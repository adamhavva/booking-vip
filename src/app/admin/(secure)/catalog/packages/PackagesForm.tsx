"use client";

import { useCallback, useMemo } from "react";
import { getAdminReferenceData, listPackages } from "@/app/actions/admin";
import type { AdminPackageRow, AdminReferenceData } from "@/types/admin";
import EntityFormPage from "@/components/admin/EntityFormPage";
import type { FieldSpec, FieldValues } from "@/components/admin/fields";
import { useAdminRow, useAdminValue } from "@/components/admin/useAdminList";

const LIST_PATH = "/admin/catalog/packages";

const getKey = (row: AdminPackageRow) => row.id;

/**
 * The package form — shared by the create page and the edit page.
 *
 * A package is a purchasable variant of a product ("per pax" or "per unit"),
 * so the product picker and the price fields follow the unit kind.
 */
export default function PackagesForm({
  mode,
  id,
}: {
  mode: "create" | "edit";
  id?: string;
}) {
  const load = useCallback(() => listPackages(), []);
  const { row, loading: rowLoading, error: rowError, missing } = useAdminRow<AdminPackageRow>(
    id,
    load,
    getKey
  );

  const reference = useCallback(() => getAdminReferenceData(), []);
  const { data: refs, loading: refsLoading } = useAdminValue<AdminReferenceData>(reference);

  const fields = useMemo<FieldSpec[]>(
    () => [
      { name: "label", label: "Label", kind: "text", hint: "Contoh: Regular" },
      { name: "productId", label: "Produk", kind: "select", options: refs?.products ?? [] },
      {
        name: "unitKind",
        label: "Jenis Unit",
        kind: "select",
        options: [
          { value: "per_pax", label: "Per Pax" },
          { value: "per_unit", label: "Per Unit" },
        ],
      },
      { name: "adultUsdCents", label: "Harga Dewasa", kind: "money" },
      { name: "childUsdCents", label: "Harga Anak", kind: "money" },
      { name: "infantUsdCents", label: "Harga Bayi", kind: "money" },
      { name: "unitUsdCents", label: "Harga Unit", kind: "money" },
      { name: "durationHours", label: "Durasi (jam)", kind: "number" },
      { name: "extraHourUsdCents", label: "Biaya Jam Tambahan", kind: "money" },
      { name: "sortOrder", label: "Urutan", kind: "number" },
      { name: "active", label: "Aktif", kind: "toggle" },
    ],
    [refs]
  );

  const initialValues = useMemo<FieldValues>(
    () => ({
      label: row?.label ?? "",
      productId: row?.productId ?? refs?.products[0]?.value ?? "",
      unitKind: row?.unitKind ?? "per_pax",
      adultUsdCents: row?.adultUsdCents ?? null,
      childUsdCents: row?.childUsdCents ?? null,
      infantUsdCents: row?.infantUsdCents ?? null,
      unitUsdCents: row?.unitUsdCents ?? null,
      durationHours: row?.durationHours ?? null,
      extraHourUsdCents: row?.extraHourUsdCents ?? null,
      sortOrder: row?.sortOrder ?? 0,
      active: row?.active ?? true,
    }),
    [row, refs]
  );

  return (
    <EntityFormPage
      table="package"
      id={id}
      title={mode === "edit" ? "Edit Paket" : "Tambah Paket"}
      subtitle="Paket adalah varian pembelian dari sebuah produk."
      listPath={LIST_PATH}
      listLabel="Paket"
      fields={fields}
      initialValues={initialValues}
      loading={rowLoading || refsLoading}
      loadError={rowError}
      rowMissing={missing}
      entityName={row?.label ?? null}
    />
  );
}
