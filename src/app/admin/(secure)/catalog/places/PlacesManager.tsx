"use client";

import { useCallback, useMemo } from "react";
import { listPlaces, setCatalogActive, upsertAirport } from "@/app/actions/admin";
import type { AdminPlaceRow } from "@/types/admin";
import EntityManager, { type FieldSpec, type FieldValues } from "@/components/admin/EntityManager";
import StatusToggle from "@/components/admin/StatusToggle";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList } from "@/components/admin/useAdminList";
import { buildPlaceTree, descendantPlaceIds, flattenPlaceTree } from "@/lib/places";

/**
 * Place table — airports and cities shared by the products.
 *
 * The places form a hierarchy: a place may point at a parent place (a city
 * parents the airports below it). The table renders that hierarchy indented,
 * and the drawer lets the operator pick a parent and the order inside the
 * group — which is exactly what the grouped dropdowns use.
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

  /** The ids that may not become the parent of `rowId` (its own subtree). */
  const blockedParents = useCallback(
    (rowId: string | null) => {
      if (!rowId) return new Set<string>();
      return descendantPlaceIds(rows, rowId);
    },
    [rows]
  );

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
      parentId: (values.parentId as string | null) || null,
      sortOrder: typeof values.sortOrder === "number" ? values.sortOrder : 0,
    });
    reload();
  };

  const fieldsFor = (row: AdminPlaceRow | null): FieldSpec[] => {
    const blocked = blockedParents(row?.id ?? null);
    const parentOptions = ordered
      .filter((entry) => !blocked.has(entry.row.id))
      .map((entry) => ({
        value: entry.row.id,
        label: `${"— ".repeat(entry.depth)}${entry.row.name}${
          entry.row.iataCode ? ` (${entry.row.iataCode})` : ""
        }`,
      }));

    return [
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
      {
        name: "parentId",
        label: "Parent",
        kind: "select",
        options: parentOptions,
        hint: "Kelompokkan place di bawah parent lain (mis. kota)",
      },
      {
        name: "sortOrder",
        label: "Urutan",
        kind: "number",
        hint: "Nomor lebih kecil tampil lebih dulu di dalam group",
      },
      { name: "imageUrl", label: "URL Gambar", kind: "text", wide: true },
      { name: "active", label: "Aktif", kind: "toggle" },
    ];
  };

  const initialValuesFor = (row: AdminPlaceRow | null): FieldValues => ({
    name: row?.name ?? "",
    city: row?.city ?? "",
    kind: row?.kind ?? "airport",
    iataCode: row?.iataCode ?? "",
    country: row?.country ?? "Indonesia",
    parentId: row?.parentId ?? "",
    sortOrder: row?.sortOrder ?? 0,
    imageUrl: row?.imageUrl ?? "",
    active: row?.active ?? true,
  });

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
