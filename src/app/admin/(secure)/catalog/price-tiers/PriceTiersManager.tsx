"use client";

import { useCallback } from "react";
import {
  getAdminReferenceData,
  listPriceTiers,
  reorderCatalog,
  setCatalogActive,
  upsertPriceTier,
} from "@/app/actions/admin";
import type { AdminPriceTierRow, AdminReferenceData } from "@/types/admin";
import EntityManager, { type FieldSpec, type FieldValues } from "@/components/admin/EntityManager";
import StatusToggle from "@/components/admin/StatusToggle";
import { formatCents } from "@/components/admin/MoneyField";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList, useAdminValue } from "@/components/admin/useAdminList";

/**
 * Price tier table.
 *
 * Labels repeat across service lines ("Up to $50" exists once per line), so
 * the line scope is always shown next to the label — otherwise an operator
 * would edit the wrong row.
 */
export default function PriceTiersManager() {
  const load = useCallback(() => listPriceTiers(), []);
  const { rows, loading, error, reload } = useAdminList<AdminPriceTierRow>(load);

  const reference = useCallback(() => getAdminReferenceData(), []);
  const { data: refs } = useAdminValue<AdminReferenceData>(reference);

  const handleSave = async (values: FieldValues, row: AdminPriceTierRow | null) => {
    await upsertPriceTier({
      id: row?.id,
      lineId: (values.lineId as string | null) || null,
      label: String(values.label ?? "").trim(),
      maxUsdCents: Number(values.maxUsdCents ?? 0),
      sortOrder: Number(values.sortOrder ?? 0),
      active: values.active === true,
    });
    reload();
  };

  const fieldsFor = (_row: AdminPriceTierRow | null): FieldSpec[] => [
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
  ];

  const initialValuesFor = (row: AdminPriceTierRow | null): FieldValues => ({
    label: row?.label ?? "",
    lineId: row?.lineId ?? "",
    maxUsdCents: row?.maxUsdCents ?? 0,
    sortOrder: row?.sortOrder ?? 0,
    active: row?.active ?? true,
  });

  const columns = [
    {
      key: "label",
      header: "Label",
      render: (row: AdminPriceTierRow) => (
        <span className="font-medium">{row.label}</span>
      ),
    },
    {
      key: "line",
      header: "Scope",
      render: (row: AdminPriceTierRow) => (
        <span className="text-[12px] text-[var(--admin-muted)]">
          {row.lineLabel ?? "Global"}
        </span>
      ),
    },
    {
      key: "max",
      header: "Maksimum",
      className: "text-right",
      render: (row: AdminPriceTierRow) => (
        <span className="tabular-nums">{formatCents(row.maxUsdCents)}</span>
      ),
    },
    {
      key: "order",
      header: "Urutan",
      className: "w-[76px]",
      render: (row: AdminPriceTierRow) => (
        <span className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Naikkan urutan"
            className={`${adminClass.buttonGhost} h-7 w-7 p-0`}
            onClick={async () => {
              await reorderCatalog({ table: "priceTier", id: row.id, direction: "up" });
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
              await reorderCatalog({ table: "priceTier", id: row.id, direction: "down" });
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
      render: (row: AdminPriceTierRow) => (
        <StatusToggle
          active={row.active}
          onChange={async (next) => {
            await setCatalogActive({ table: "priceTier", id: row.id, active: next });
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
        createLabel="Tambah Price Tier"
        editLabel="Edit Price Tier"
        emptyTitle="Belum ada price tier"
        emptyDescription="Tambahkan rentang harga untuk filter katalog."
        loading={loading}
      />
    </div>
  );
}
