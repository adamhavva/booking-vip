"use client";

import { useCallback } from "react";
import {
  getAdminReferenceData,
  getProductRelations,
  listProducts,
  setCatalogActive,
  setProductAddOns,
  setProductAmenities,
  upsertProduct,
} from "@/app/actions/admin";
import type { AdminProductRow, AdminReferenceData } from "@/types/admin";
import EntityManager, { type FieldSpec, type FieldValues } from "@/components/admin/EntityManager";
import StatusToggle from "@/components/admin/StatusToggle";
import { formatCents } from "@/components/admin/MoneyField";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList, useAdminValue } from "@/components/admin/useAdminList";

/**
 * Product catalog table.
 *
 * Rows come from `listProducts()` (a server action) so the page shell stays
 * static; every write goes back through the admin actions.
 */
export default function ProductsManager() {
  const load = useCallback(() => listProducts(), []);
  const { rows, loading, error, reload } = useAdminList<AdminProductRow>(load);

  const reference = useCallback(async (): Promise<AdminReferenceData> => {
    return getAdminReferenceData();
  }, []);
  const { data: refs } = useAdminValue<AdminReferenceData>(reference);

  const handleSave = async (values: FieldValues, row: AdminProductRow | null) => {
    const amenityIds = Array.isArray(values.amenityIds) ? (values.amenityIds as string[]) : [];
    const addOnIds = Array.isArray(values.addOnIds) ? (values.addOnIds as string[]) : [];

    const payload = {
      id: row?.id,
      slug: String(values.slug ?? "").trim(),
      lineId: String(values.lineId ?? ""),
      title: String(values.title ?? "").trim(),
      description: String(values.description ?? ""),
      direction: (String(values.direction ?? "both") as "arrival" | "departure" | "both"),
      leadTimeHours: Number(values.leadTimeHours ?? 0),
      leadTimeDays: Number(values.leadTimeDays ?? 0),
      included: Array.isArray(values.included) ? (values.included as string[]) : [],
      notIncluded: Array.isArray(values.notIncluded) ? (values.notIncluded as string[]) : [],
      requirements: Array.isArray(values.requirements) ? (values.requirements as string[]) : [],
      isAddOn: values.isAddOn === true,
      imageUrl: (values.imageUrl as string | null) ?? null,
      tone: String(values.tone ?? "from-sky-400 to-blue-600"),
      ribbon: (values.ribbon as string | null) ?? null,
      rating: (values.rating as number | null) ?? null,
      reviews: (values.reviews as number | null) ?? null,
      durationLabel: (values.durationLabel as string | null) ?? null,
      fromPriceUsdCents: (values.fromPriceUsdCents as number | null) ?? null,
      active: values.active === true,
      serviceTypeId: (values.serviceTypeId as string | null) || null,
      airportId: (values.airportId as string | null) || null,
    };

    const result = await upsertProduct(payload);

    // Relations are managed separately (they live in join tables).
    await setProductAmenities({ productId: result.id, amenityIds });
    await setProductAddOns({ productId: result.id, addOnIds });

    reload();
  };

  const fieldsFor = (row: AdminProductRow | null): FieldSpec[] => [
    { name: "title", label: "Judul", kind: "text", wide: true },
    { name: "slug", label: "Slug", kind: "text", hint: "URL produk, harus unik" },
    {
      name: "lineId",
      label: "Service Line",
      kind: "select",
      options: refs?.lines ?? [],
    },
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
    { name: "amenityIds", label: "Amenity", kind: "multiselect", options: refs?.amenities ?? [] },
    { name: "addOnIds", label: "Add-on", kind: "multiselect", options: refs?.addOns ?? [] },
    { name: "isAddOn", label: "Status Produk", kind: "toggle", hint: "Aktif sebagai add-on" },
    { name: "active", label: "Aktif", kind: "toggle" },
  ];

  const initialValuesFor = async (row: AdminProductRow | null): Promise<FieldValues> => {
    const base: FieldValues = {
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
      amenityIds: [] as string[],
      addOnIds: [] as string[],
      isAddOn: row?.isAddOn ?? false,
      active: row?.active ?? true,
    };

    if (!row) return base;

    const relations = await getProductRelations({ productId: row.id });
    return {
      ...base,
      amenityIds: relations.amenityIds,
      addOnIds: relations.addOnIds,
    };
  };

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
        fieldsFor={fieldsFor}
        initialValuesFor={initialValuesFor}
        onSave={handleSave}
        createLabel="Tambah Produk"
        editLabel="Edit Produk"
        emptyTitle="Belum ada produk"
        emptyDescription="Tambahkan produk pertama untuk service line ini."
        loading={loading}
      />
    </div>
  );
}
