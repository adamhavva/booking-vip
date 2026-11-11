"use client";

import { useCallback } from "react";
import { listPriceTiers, reorderCatalog, setCatalogActive } from "@/app/actions/admin";
import { deleteAdminEntity } from "@/app/actions/admin-crud";
import type { AdminPriceTierRow } from "@/types/admin";
import EntityManager from "@/components/admin/EntityManager";
import StatusToggle from "@/components/admin/StatusToggle";
import { formatCents } from "@/components/admin/MoneyField";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList } from "@/components/admin/useAdminList";

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
        createHref="/admin/catalog/price-tiers/new"
        editHref={(row) => `/admin/catalog/price-tiers/${row.id}`}
        nameOf={(row) => row.label}
        itemLabel="Price Tier"
        onDelete={async (row, typedName) => {
          const result = await deleteAdminEntity({
            table: "priceTier",
            id: row.id,
            confirmName: typedName,
          });
          if (result.ok) reload();
          return result;
        }}
        createLabel="Tambah Price Tier"
        editLabel="Edit Price Tier"
        emptyTitle="Belum ada price tier"
        emptyDescription="Tambahkan rentang harga untuk filter katalog."
        loading={loading}
      />
    </div>
  );
}
