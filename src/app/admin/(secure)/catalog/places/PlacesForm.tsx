"use client";

import { useCallback, useMemo } from "react";
import { listPlaces } from "@/app/actions/admin";
import type { AdminPlaceRow } from "@/types/admin";
import EntityFormPage from "@/components/admin/EntityFormPage";
import type { FieldSpec, FieldValues } from "@/components/admin/fields";
import { useAdminList } from "@/components/admin/useAdminList";
import { buildPlaceTree, descendantPlaceIds, flattenPlaceTree } from "@/lib/places";

const LIST_PATH = "/admin/catalog/places";

/**
 * The place form — shared by the create page and the edit page.
 *
 * Places form a hierarchy (a city parents the airports below it), so the
 * parent picker is built from the same tree the table shows. A place may
 * never become a child of itself or of one of its own descendants — those
 * options are removed from the list.
 */
export default function PlacesForm({
  mode,
  id,
}: {
  mode: "create" | "edit";
  id?: string;
}) {
  const load = useCallback(() => listPlaces(), []);
  const { rows, loading: rowLoading, error: rowError } = useAdminList<AdminPlaceRow>(load);

  const row = useMemo(
    () => (id ? (rows.find((item) => item.id === id) ?? null) : null),
    [rows, id]
  );
  const missing = Boolean(id) && !rowLoading && !rowError && row === null;

  /** The rows as an ordered tree, with the depth of every row. */
  const ordered = useMemo(() => {
    const tree = buildPlaceTree(rows);
    const byId = new Map(rows.map((r) => [r.id, r]));
    return flattenPlaceTree(tree)
      .map(({ node, depth }) => ({ row: byId.get(node.id), depth }))
      .filter((entry): entry is { row: AdminPlaceRow; depth: number } => Boolean(entry.row));
  }, [rows]);

  const parentOptions = useMemo(() => {
    // The place itself and its descendants may not become its own parent.
    const blocked = id ? descendantPlaceIds(rows, id) : new Set<string>();
    return ordered
      .filter((entry) => !blocked.has(entry.row.id))
      .map((entry) => ({
        value: entry.row.id,
        label: `${"— ".repeat(entry.depth)}${entry.row.name}${
          entry.row.iataCode ? ` (${entry.row.iataCode})` : ""
        }`,
      }));
  }, [ordered, rows, id]);

  const fields = useMemo<FieldSpec[]>(
    () => [
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
    ],
    [parentOptions]
  );

  const initialValues = useMemo<FieldValues>(
    () => ({
      name: row?.name ?? "",
      city: row?.city ?? "",
      kind: row?.kind ?? "airport",
      iataCode: row?.iataCode ?? "",
      country: row?.country ?? "Indonesia",
      parentId: row?.parentId ?? "",
      sortOrder: row?.sortOrder ?? 0,
      imageUrl: row?.imageUrl ?? "",
      active: row?.active ?? true,
    }),
    [row]
  );

  return (
    <EntityFormPage
      table="place"
      id={id}
      title={mode === "edit" ? "Edit Place" : "Tambah Place"}
      subtitle="Place adalah airport atau kota yang dipakai produk."
      listPath={LIST_PATH}
      listLabel="Place"
      fields={fields}
      initialValues={initialValues}
      loading={rowLoading}
      loadError={rowError}
      rowMissing={missing}
      entityName={row?.name ?? null}
    />
  );
}
