"use client";

import { useCallback, useMemo } from "react";
import { getAdminReferenceData, listPriceTiers } from "@/app/actions/admin";
import type { AdminPriceTierRow, AdminReferenceData } from "@/types/admin";
import EntityFormPage from "@/components/admin/EntityFormPage";
import type { FieldSpec, FieldValues } from "@/components/admin/fields";
import { useAdminRow, useAdminValue } from "@/components/admin/useAdminList";

const LIST_PATH = "/admin/catalog/price-tiers";

const getKey = (row: AdminPriceTierRow) => row.id;

/**
 * The price tier form — shared by the create page and the edit page.
 *
 * A price tier belongs to a service line, or to every line when the scope is
 * left empty ("global").
 */
export default function PriceTiersForm({
  mode,
  id,
}: {
  mode: "create" | "edit";
  id?: string;
}) {
  const load = useCallback(() => listPriceTiers(), []);
  const { row, loading: rowLoading, error: rowError, missing } = useAdminRow<AdminPriceTierRow>(
    id,
    load,
    getKey
  );

  const reference = useCallback(() => getAdminReferenceData(), []);
  const { data: refs, loading: refsLoading } = useAdminValue<AdminReferenceData>(reference);

  const fields = useMemo<FieldSpec[]>(
    () => [
      { name: "label", label: "Label", kind: "text", hint: "Contoh: Up to $50" },
      {
        name: "lineId",
        label: "Service Line",
        kind: "select",
        options: refs?.lines ?? [],
        hint: "Kosongkan untuk tier global",
      },
      { name: "maxUsdCents", label: "Batas Maksimum", kind: "money" },
      { name: "sortOrder", label: "Urutan", kind: "number" },
      { name: "active", label: "Aktif", kind: "toggle" },
    ],
    [refs]
  );

  const initialValues = useMemo<FieldValues>(
    () => ({
      label: row?.label ?? "",
      lineId: row?.lineId ?? "",
      maxUsdCents: row?.maxUsdCents ?? 0,
      sortOrder: row?.sortOrder ?? 0,
      active: row?.active ?? true,
    }),
    [row]
  );

  return (
    <EntityFormPage
      table="priceTier"
      id={id}
      title={mode === "edit" ? "Edit Price Tier" : "Tambah Price Tier"}
      subtitle="Price tier membatasi rentang harga yang bisa dipilih di katalog."
      listPath={LIST_PATH}
      listLabel="Price Tier"
      fields={fields}
      initialValues={initialValues}
      loading={rowLoading || refsLoading}
      loadError={rowError}
      rowMissing={missing}
      entityName={row?.label ?? null}
    />
  );
}
