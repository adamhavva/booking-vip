"use client";

import { useCallback } from "react";
import {
  listServiceLines,
  reorderCatalog,
  setCatalogActive,
  upsertServiceLine,
} from "@/app/actions/admin";
import type { AdminServiceLineRow } from "@/types/admin";
import EntityManager, { type FieldSpec, type FieldValues } from "@/components/admin/EntityManager";
import StatusToggle from "@/components/admin/StatusToggle";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList } from "@/components/admin/useAdminList";

/** Service line table — the four top-level service menus. */
export default function ServiceLinesManager() {
  const load = useCallback(() => listServiceLines(), []);
  const { rows, loading, error, reload } = useAdminList<AdminServiceLineRow>(load);

  const handleSave = async (values: FieldValues, row: AdminServiceLineRow | null) => {
    await upsertServiceLine({
      id: row?.id,
      slug: String(values.slug ?? "").trim(),
      label: String(values.label ?? "").trim(),
      short: String(values.short ?? "").trim(),
      badge: (values.badge as string | null) || null,
      tone: String(values.tone ?? "from-sky-400 to-blue-600"),
      imageUrl: (values.imageUrl as string | null) || null,
      sortOrder: Number(values.sortOrder ?? 0),
      active: values.active === true,
    });
    reload();
  };

  const fieldsFor = (_row: AdminServiceLineRow | null): FieldSpec[] => [
    { name: "label", label: "Label", kind: "text" },
    { name: "slug", label: "Slug", kind: "text", hint: "e.g. vip-service" },
    { name: "short", label: "Short", kind: "text", hint: "2–3 huruf untuk ikon" },
    { name: "badge", label: "Badge", kind: "text" },
    { name: "tone", label: "Tone", kind: "text", hint: "Kelas Tailwind gradient" },
    { name: "imageUrl", label: "URL Gambar", kind: "text", wide: true },
    { name: "sortOrder", label: "Urutan", kind: "number" },
    { name: "active", label: "Aktif", kind: "toggle" },
  ];

  const initialValuesFor = (row: AdminServiceLineRow | null): FieldValues => ({
    label: row?.label ?? "",
    slug: row?.slug ?? "",
    short: row?.short ?? "",
    badge: row?.badge ?? "",
    tone: row?.tone ?? "from-sky-400 to-blue-600",
    imageUrl: row?.imageUrl ?? "",
    sortOrder: row?.sortOrder ?? 0,
    active: row?.active ?? true,
  });

  const columns = [
    {
      key: "label",
      header: "Service Line",
      render: (row: AdminServiceLineRow) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.label}</div>
          <div className="truncate text-[11px] text-[var(--admin-muted)]">/{row.slug}</div>
        </div>
      ),
    },
    {
      key: "short",
      header: "Short",
      render: (row: AdminServiceLineRow) => (
        <span className="tabular-nums text-[12px] text-[var(--admin-muted)]">{row.short}</span>
      ),
    },
    {
      key: "products",
      header: "Produk",
      className: "text-right",
      render: (row: AdminServiceLineRow) => (
        <span className="tabular-nums text-[var(--admin-muted)]">{row.productCount}</span>
      ),
    },
    {
      key: "order",
      header: "Urutan",
      className: "w-[76px]",
      render: (row: AdminServiceLineRow) => (
        <span className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Naikkan urutan"
            className={`${adminClass.buttonGhost} h-7 w-7 p-0`}
            onClick={async () => {
              await reorderCatalog({ table: "serviceLine", id: row.id, direction: "up" });
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
              await reorderCatalog({ table: "serviceLine", id: row.id, direction: "down" });
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
      render: (row: AdminServiceLineRow) => (
        <StatusToggle
          active={row.active}
          onChange={async (next) => {
            await setCatalogActive({ table: "serviceLine", id: row.id, active: next });
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
        createLabel="Tambah Service Line"
        editLabel="Edit Service Line"
        emptyTitle="Belum ada service line"
        emptyDescription="Tambahkan menu layanan tingkat atas."
        loading={loading}
      />
    </div>
  );
}
