"use client";

import { useCallback, useMemo } from "react";
import {
  getAdminReferenceData,
  getProductRelations,
  listProducts,
} from "@/app/actions/admin";
import type { AdminProductRow, AdminReferenceData } from "@/types/admin";
import EntityFormPage from "@/components/admin/EntityFormPage";
import type { FieldSpec, FieldValues } from "@/components/admin/fields";
import { useAdminRow, useAdminValue } from "@/components/admin/useAdminList";

const LIST_PATH = "/admin/catalog/products";

const getKey = (row: AdminProductRow) => row.id;

/**
 * The product form — shared by the create page and the edit page.
 *
 * The reference data (service lines, service types, places, amenities) and
 * the join rows (amenities, add-ons) are loaded through server actions, so
 * the page shell stays static.
 */
export default function ProductsForm({
  mode,
  id,
}: {
  mode: "create" | "edit";
  id?: string;
}) {
  const load = useCallback(() => listProducts(), []);
  const { row, loading: rowLoading, error: rowError, missing } = useAdminRow<AdminProductRow>(
    id,
    load,
    getKey
  );

  const reference = useCallback(() => getAdminReferenceData(), []);
  const { data: refs, loading: refsLoading } = useAdminValue<AdminReferenceData>(reference);

  const relationsLoad = useCallback(async () => {
    if (!id) return null;
    return getProductRelations({ productId: id });
  }, [id]);
  const { data: relations, loading: relationsLoading } = useAdminValue(relationsLoad);

  const fields = useMemo<FieldSpec[]>(
    () => [
      { name: "title", label: "Judul", kind: "text", wide: true },
      { name: "slug", label: "Slug", kind: "text", hint: "URL produk, harus unik" },
      { name: "lineId", label: "Service Line", kind: "select", options: refs?.lines ?? [] },
      {
        name: "serviceTypeId",
        label: "Tipe Layanan",
        kind: "select",
        options: refs?.serviceTypes ?? [],
      },
      { name: "airportId", label: "Place", kind: "select", options: refs?.places ?? [] },
      {
        name: "direction",
        label: "Arah",
        kind: "select",
        options: [
          { value: "both", label: "Both" },
          { value: "arrival", label: "Arrival" },
          { value: "departure", label: "Departure" },
        ],
      },
      { name: "fromPriceUsdCents", label: "Harga Mulai", kind: "money" },
      { name: "rating", label: "Rating", kind: "number" },
      { name: "reviews", label: "Jumlah Ulasan", kind: "number" },
      { name: "durationLabel", label: "Label Durasi", kind: "text", placeholder: "e.g. 3 jam" },
      { name: "leadTimeHours", label: "Lead Time (jam)", kind: "number" },
      { name: "leadTimeDays", label: "Lead Time (hari)", kind: "number" },
      { name: "imageUrl", label: "URL Gambar", kind: "text", wide: true },
      { name: "ribbon", label: "Ribbon", kind: "text" },
      { name: "tone", label: "Tone", kind: "text" },
      { name: "description", label: "Deskripsi", kind: "textarea", wide: true },
      { name: "included", label: "Termasuk", kind: "tags", wide: true },
      { name: "notIncluded", label: "Tidak Termasuk", kind: "tags", wide: true },
      { name: "requirements", label: "Persyaratan", kind: "tags", wide: true },
      {
        name: "amenityIds",
        label: "Amenity",
        kind: "multiselect",
        options: refs?.amenities ?? [],
      },
      { name: "addOnIds", label: "Add-on", kind: "multiselect", options: refs?.addOns ?? [] },
      { name: "isAddOn", label: "Status Produk", kind: "toggle", hint: "Aktif sebagai add-on" },
      { name: "active", label: "Aktif", kind: "toggle" },
    ],
    [refs]
  );

  const initialValues = useMemo<FieldValues>(
    () => ({
      title: row?.title ?? "",
      slug: row?.slug ?? "",
      lineId: row?.lineId ?? refs?.lines[0]?.value ?? "",
      serviceTypeId: row?.serviceTypeId ?? "",
      airportId: row?.airportId ?? "",
      direction: row?.direction ?? "both",
      fromPriceUsdCents: row?.fromPriceUsdCents ?? null,
      rating: row?.rating ?? null,
      reviews: row?.reviews ?? null,
      durationLabel: row?.durationLabel ?? "",
      leadTimeHours: row?.leadTimeHours ?? 0,
      leadTimeDays: row?.leadTimeDays ?? 0,
      imageUrl: row?.imageUrl ?? "",
      ribbon: row?.ribbon ?? "",
      tone: row?.tone ?? "from-sky-400 to-blue-600",
      description: row?.description ?? "",
      included: row?.included ?? [],
      notIncluded: row?.notIncluded ?? [],
      requirements: row?.requirements ?? [],
      amenityIds: relations?.amenityIds ?? [],
      addOnIds: relations?.addOnIds ?? [],
      isAddOn: row?.isAddOn ?? false,
      active: row?.active ?? true,
    }),
    [row, refs, relations]
  );

  return (
    <EntityFormPage
      table="product"
      id={id}
      title={mode === "edit" ? "Edit Produk" : "Tambah Produk"}
      subtitle="Produk adalah item yang bisa dipesan pada service line tertentu."
      listPath={LIST_PATH}
      listLabel="Produk"
      fields={fields}
      initialValues={initialValues}
      loading={rowLoading || refsLoading || relationsLoading}
      loadError={rowError}
      rowMissing={missing}
      entityName={row?.title ?? null}
    />
  );
}
