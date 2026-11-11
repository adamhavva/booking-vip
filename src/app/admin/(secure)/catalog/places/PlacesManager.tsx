"use client";

import { useCallback } from "react";
import { listPlaces, setCatalogActive, upsertAirport } from "@/app/actions/admin";
import type { AdminPlaceRow } from "@/types/admin";
import EntityManager, { type FieldSpec, type FieldValues } from "@/components/admin/EntityManager";
import StatusToggle from "@/components/admin/StatusToggle";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList } from "@/components/admin/useAdminList";

/** Place table — airports and cities shared by the products. */
export default function PlacesManager() {
  const load = useCallback(() => listPlaces(), []);
  const { rows, loading, error, reload } = useAdminList<AdminPlaceRow>(load);

  const handleSave = async (values: FieldValues, row: AdminPlaceRow | null) => {
    await upsertAirport({
      id: row?.id,
      kind: (String(values.kind ?? "airport") as "airport" | "city"),
      iataCode: (values.iataCode as string | null) || null,
      name: String(values.name ?? "").trim(),
      city: String(values.city ?? "").trim(),
      country: String(values.country ?? "Indonesia").trim(),
      imageUrl: (values.imageUrl as string | null) || null,
      active: values.active === true,
    });
    reload();
  };

  const fieldsFor = (_row: AdminPlaceRow | null): FieldSpec[] => [
    { name: "name", label: "Nama", kind: "text" },
    { name: "city", label: "Kota", kind: "text" },
    {
      name: "kind",
      label: "Jenis",
      kind: "select",
      options: [
        { value: "airport", label: "Airport" },
        { value: "city", label: "City" },
      ],
    },
    { name: "iataCode", label: "Kode IATA", kind: "text", hint: "Kosongkan untuk kota" },
    { name: "country", label: "Negara", kind: "text" },
    { name: "imageUrl", label: "URL Gambar", kind: "text", wide: true },
    { name: "active", label: "Aktif", kind: "toggle" },
  ];

  const initialValuesFor = (row: AdminPlaceRow | null): FieldValues => ({
    name: row?.name ?? "",
    city: row?.city ?? "",
    kind: row?.kind ?? "airport",
    iataCode: row?.iataCode ?? "",
    country: row?.country ?? "Indonesia",
    imageUrl: row?.imageUrl ?? "",
    active: row?.active ?? true,
  });

  const columns = [
    {
      key: "name",
      header: "Place",
      render: (row: AdminPlaceRow) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.name}</div>
          <div className="truncate text-[11px] text-[var(--admin-muted)]">
            {row.city} · {row.country}
          </div>
        </div>
      ),
    },
    {
      key: "kind",
      header: "Jenis",
      render: (row: AdminPlaceRow) => (
        <span className="text-[12px] text-[var(--admin-muted)]">
          {row.kind === "airport" ? "Airport" : "City"}
        </span>
      ),
    },
    {
      key: "iata",
      header: "IATA",
      render: (row: AdminPlaceRow) => (
        <span className="tabular-nums text-[12px]">{row.iataCode ?? "—"}</span>
      ),
    },
    {
      key: "products",
      header: "Produk",
      className: "text-right",
      render: (row: AdminPlaceRow) => (
        <span className="tabular-nums text-[var(--admin-muted)]">{row.productCount}</span>
      ),
    },
    {
      key: "active",
      header: "Status",
      className: "w-[70px]",
      render: (row: AdminPlaceRow) => (
        <StatusToggle
          active={row.active}
          onChange={async (next) => {
            await setCatalogActive({ table: "place", id: row.id, active: next });
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
        createLabel="Tambah Place"
        editLabel="Edit Place"
        emptyTitle="Belum ada place"
        emptyDescription="Tambahkan airport atau kota yang dipakai produk."
        loading={loading}
      />
    </div>
  );
}
