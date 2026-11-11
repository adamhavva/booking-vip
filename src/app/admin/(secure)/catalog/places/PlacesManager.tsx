"use client";

import { useCallback, useMemo } from "react";
import { listPlaces, setCatalogActive } from "@/app/actions/admin";
import { deleteAdminEntity } from "@/app/actions/admin-crud";
import type { AdminPlaceRow } from "@/types/admin";
import EntityManager from "@/components/admin/EntityManager";
import StatusToggle from "@/components/admin/StatusToggle";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList } from "@/components/admin/useAdminList";
import { buildPlaceTree, flattenPlaceTree } from "@/lib/places";

/**
 * Place table — airports and cities shared by the products.
 *
 * The places form a hierarchy: a place may point at a parent place (a city
 * parents the airports below it). The table renders that hierarchy indented,
 * and the create/edit page lets the operator pick a parent and the order
 * inside the group — which is exactly what the grouped dropdowns use.
 */
export default function PlacesManager() {
  const load = useCallback(() => listPlaces(), []);
  const { rows, loading, error, reload } = useAdminList<AdminPlaceRow>(load);

  /**
   * The rows ordered as a tree (parents before their children), with the
   * depth of every row so the table can indent it.
   */
  const ordered = useMemo(() => {
    const tree = buildPlaceTree(rows);
    const byId = new Map(rows.map((r) => [r.id, r]));
    return flattenPlaceTree(tree)
      .map(({ node, depth }) => ({ row: byId.get(node.id), depth }))
      .filter((entry): entry is { row: AdminPlaceRow; depth: number } => Boolean(entry.row));
  }, [rows]);

  /** The depth of every place, used to indent the table. */
  const depthById = useMemo(
    () => new Map(ordered.map((entry) => [entry.row.id, entry.depth])),
    [ordered]
  );

  const columns = [
    {
      key: "name",
      header: "Place",
      render: (row: AdminPlaceRow) => {
        const depth = depthById.get(row.id) ?? 0;
        return (
          <div
            className="min-w-0"
            style={depth > 0 ? { paddingLeft: `${depth * 14}px` } : undefined}
          >
            <div className="truncate font-medium">
              {depth > 0 ? (
                <span className="mr-1 text-[var(--admin-muted)]">↳</span>
              ) : null}
              {row.name}
            </div>
            <div className="truncate text-[11px] text-[var(--admin-muted)]">
              {row.city} · {row.country}
            </div>
          </div>
        );
      },
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
      key: "parent",
      header: "Parent",
      render: (row: AdminPlaceRow) => (
        <span className="text-[12px] text-[var(--admin-muted)]">
          {row.parentName ?? "—"}
        </span>
      ),
    },
    {
      key: "order",
      header: "Urutan",
      className: "text-right",
      render: (row: AdminPlaceRow) => (
        <span className="tabular-nums text-[12px] text-[var(--admin-muted)]">
          {row.sortOrder}
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
        rows={ordered.map((entry) => entry.row)}
        columns={columns}
        getKey={(row) => row.id}
        createHref="/admin/catalog/places/new"
        editHref={(row) => `/admin/catalog/places/${row.id}`}
        nameOf={(row) => row.name}
        itemLabel="Place"
        onDelete={async (row, typedName) => {
          const result = await deleteAdminEntity({
            table: "place",
            id: row.id,
            confirmName: typedName,
          });
          if (result.ok) reload();
          return result;
        }}
        createLabel="Tambah Place"
        editLabel="Edit Place"
        emptyTitle="Belum ada place"
        emptyDescription="Tambahkan airport atau kota yang dipakai produk."
        loading={loading}
      />
    </div>
  );
}
