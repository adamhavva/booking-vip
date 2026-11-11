"use client";

import { useCallback } from "react";
import {
  listPackages,
  reorderCatalog,
  setCatalogActive,
  upsertPackage,
} from "@/app/actions/admin";
import { getAdminReferenceData } from "@/app/actions/admin";
import type { AdminPackageRow, AdminReferenceData } from "@/types/admin";
import EntityManager, { type FieldSpec, type FieldValues } from "@/components/admin/EntityManager";
import StatusToggle from "@/components/admin/StatusToggle";
import { formatCents } from "@/components/admin/MoneyField";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList, useAdminValue } from "@/components/admin/useAdminList";

/** Package catalog table — one row per purchasable variant of a product. */
export default function PackagesManager() {
  const load = useCallback(() => listPackages(), []);
  const { rows, loading, error, reload } = useAdminList<AdminPackageRow>(load);

  const reference = useCallback(() => getAdminReferenceData(), []);
  const { data: refs } = useAdminValue<AdminReferenceData>(reference);

  const handleSave = async (values: FieldValues, row: AdminPackageRow | null) => {
    await upsertPackage({
      id: row?.id,
      productId: String(values.productId ?? ""),
      label: String(values.label ?? "").trim(),
      unitKind: String(values.unitKind ?? "per_pax") as "per_pax" | "per_unit",
      adultUsdCents: (values.adultUsdCents as number | null) ?? null,
      childUsdCents: (values.childUsdCents as number | null) ?? null,
      infantUsdCents: (values.infantUsdCents as number | null) ?? null,
      unitUsdCents: (values.unitUsdCents as number | null) ?? null,
      durationHours: (values.durationHours as number | null) ?? null,
      extraHourUsdCents: (values.extraHourUsdCents as number | null) ?? null,
      sortOrder: Number(values.sortOrder ?? 0),
      active: values.active === true,
    });
    reload();
  };

  const fieldsFor = (_row: AdminPackageRow | null): FieldSpec[] => [
    { name: "label", label: "Label", kind: "text" },
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
  ];

  const initialValuesFor = (row: AdminPackageRow | null): FieldValues => ({
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
  });

  const priceOf = (row: AdminPackageRow) => {
    const cents =
      row.unitKind === "per_unit" ? row.unitUsdCents : row.adultUsdCents ?? row.unitUsdCents;
    return cents == null ? "—" : formatCents(cents);
  };

  const columns = [
    {
      key: "label",
      header: "Paket",
      render: (row: AdminPackageRow) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.label}</div>
          <div className="truncate text-[11px] text-[var(--admin-muted)]">{row.productTitle}</div>
        </div>
      ),
    },
    {
      key: "unitKind",
      header: "Unit",
      render: (row: AdminPackageRow) => (
        <span className="text-[12px] text-[var(--admin-muted)]">
          {row.unitKind === "per_pax" ? "Per pax" : "Per unit"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Harga",
      className: "text-right",
      render: (row: AdminPackageRow) => <span className="tabular-nums">{priceOf(row)}</span>,
    },
    {
      key: "order",
      header: "Urutan",
      className: "w-[76px]",
      render: (row: AdminPackageRow) => (
        <span className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Naikkan urutan"
            className={`${adminClass.buttonGhost} h-7 w-7 p-0`}
            onClick={async () => {
              await reorderCatalog({ table: "package", id: row.id, direction: "up" });
              reload();
            }}
          >
            <ArrowUpIcon width={14} height={14} />
          </button>
          <button
            type="button"
            aria-label="Turunkan urutan"
            className={`${adminClass.buttonGhost} h-7 w-7 p-0`}
            onClick={async () => {
              await reorderCatalog({ table: "package", id: row.id, direction: "down" });
              reload();
            }}
          >
            <ArrowDownIcon width={14} height={14} />
          </button>
        </span>
      ),
    },
    {
      key: "active",
      header: "Status",
      className: "w-[70px]",
      render: (row: AdminPackageRow) => (
        <StatusToggle
          active={row.active}
          onChange={async (next) => {
            await setCatalogActive({ table: "package", id: row.id, active: next });
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
        createLabel="Tambah Paket"
        editLabel="Edit Paket"
        emptyTitle="Belum ada paket"
        emptyDescription="Tambahkan paket (varian pembelian) untuk sebuah produk."
        loading={loading}
      />
    </div>
  );
}
