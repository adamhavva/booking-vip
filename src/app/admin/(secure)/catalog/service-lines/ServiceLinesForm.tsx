"use client";

import { useCallback, useMemo } from "react";
import { listServiceLines } from "@/app/actions/admin";
import type { AdminServiceLineRow } from "@/types/admin";
import EntityFormPage from "@/components/admin/EntityFormPage";
import type { FieldSpec, FieldValues } from "@/components/admin/fields";
import { useAdminRow } from "@/components/admin/useAdminList";

const LIST_PATH = "/admin/catalog/service-lines";

const getKey = (row: AdminServiceLineRow) => row.id;

/**
 * The service line form — shared by the create page and the edit page.
 *
 * A service line is one of the top-level service menus of the site.
 */
export default function ServiceLinesForm({
  mode,
  id,
}: {
  mode: "create" | "edit";
  id?: string;
}) {
  const load = useCallback(() => listServiceLines(), []);
  const { row, loading: rowLoading, error: rowError, missing } = useAdminRow<AdminServiceLineRow>(
    id,
    load,
    getKey
  );

  const fields = useMemo<FieldSpec[]>(
    () => [
      { name: "label", label: "Label", kind: "text" },
      { name: "slug", label: "Slug", kind: "text", hint: "e.g. vip-service" },
      { name: "short", label: "Short", kind: "text", hint: "2–3 huruf untuk ikon" },
      { name: "badge", label: "Badge", kind: "text" },
      { name: "tone", label: "Tone", kind: "text", hint: "Kelas Tailwind gradient" },
      { name: "imageUrl", label: "URL Gambar", kind: "text", wide: true },
      { name: "sortOrder", label: "Urutan", kind: "number" },
      { name: "active", label: "Aktif", kind: "toggle" },
    ],
    []
  );

  const initialValues = useMemo<FieldValues>(
    () => ({
      label: row?.label ?? "",
      slug: row?.slug ?? "",
      short: row?.short ?? "",
      badge: row?.badge ?? "",
      tone: row?.tone ?? "from-sky-400 to-blue-600",
      imageUrl: row?.imageUrl ?? "",
      sortOrder: row?.sortOrder ?? 0,
      active: row?.active ?? true,
    }),
    [row]
  );

  return (
    <EntityFormPage
      table="serviceLine"
      id={id}
      title={mode === "edit" ? "Edit Service Line" : "Tambah Service Line"}
      subtitle="Service line adalah menu layanan tingkat atas."
      listPath={LIST_PATH}
      listLabel="Service Line"
      fields={fields}
      initialValues={initialValues}
      loading={rowLoading}
      loadError={rowError}
      rowMissing={missing}
      entityName={row?.label ?? null}
    />
  );
}
