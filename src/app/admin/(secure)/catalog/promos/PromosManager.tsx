"use client";

import { useCallback } from "react";
import { listPromoCodes } from "@/app/actions/admin";
import { deleteAdminEntity } from "@/app/actions/admin-crud";
import type { AdminPromoCodeRow } from "@/types/admin";
import EntityManager from "@/components/admin/EntityManager";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList } from "@/components/admin/useAdminList";

/** Promo codes — the discounts that can be applied on a booking. */
export default function PromosManager() {
  const load = useCallback(() => listPromoCodes(), []);
  const { rows, loading, error, reload } = useAdminList<AdminPromoCodeRow>(load);

  const columns = [
    {
      key: "code",
      header: "Kode",
      render: (row: AdminPromoCodeRow) => (
        <span className="font-mono text-[12px] font-medium">{row.code}</span>
      ),
    },
    {
      key: "title",
      header: "Judul",
      render: (row: AdminPromoCodeRow) => <span>{row.title}</span>,
    },
    {
      key: "value",
      header: "Diskon",
      render: (row: AdminPromoCodeRow) =>
        row.type === "fixed" ? (
          <span className="tabular-nums">${(row.value / 100).toFixed(2)}</span>
        ) : (
          <span className="tabular-nums">{row.value}%</span>
        ),
    },
    {
      key: "used",
      header: "Pemakaian",
      className: "text-right",
      render: (row: AdminPromoCodeRow) => (
        <span className="tabular-nums text-[var(--admin-muted)]">
          {row.usedCount}
          {row.usageLimit != null ? ` / ${row.usageLimit}` : ""}
        </span>
      ),
    },
    {
      key: "active",
      header: "Status",
      className: "text-right",
      render: (row: AdminPromoCodeRow) => (
        <span className={`${adminClass.pill} ${row.active ? adminClass.pillOn : adminClass.pillOff}`}>
          {row.active ? "Aktif" : "Nonaktif"}
        </span>
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
        createHref="/admin/catalog/promos/new"
        editHref={(row) => `/admin/catalog/promos/${row.id}`}
        nameOf={(row) => row.code}
        itemLabel="Promo"
        onDelete={async (row, typedName) => {
          const result = await deleteAdminEntity({
            table: "promoCode",
            id: row.id,
            confirmName: typedName,
          });
          if (result.ok) reload();
          return result;
        }}
        createLabel="Tambah Promo"
        editLabel="Edit Promo"
        emptyTitle="Belum ada promo"
        emptyDescription="Buat kode promo untuk memotong harga customer."
        loading={loading}
      />
    </div>
  );
}
