"use client";

import { useCallback, useMemo } from "react";
import { listPromoCodes } from "@/app/actions/admin";
import type { AdminPromoCodeRow } from "@/types/admin";
import EntityFormPage from "@/components/admin/EntityFormPage";
import type { FieldSpec, FieldValues } from "@/components/admin/fields";
import { useAdminRow } from "@/components/admin/useAdminList";

const LIST_PATH = "/admin/catalog/promos";

const getKey = (row: AdminPromoCodeRow) => row.id;

/** `2026-11-12T09:30` — the shape the `datetime-local` input expects. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/**
 * The promo form — shared by the create page and the edit page.
 *
 * A promo either takes a fixed amount off (USD) or a percentage of the
 * subtotal, so only one of the two value fields is shown at a time.
 */
export default function PromosForm({
  mode,
  id,
}: {
  mode: "create" | "edit";
  id?: string;
}) {
  const load = useCallback(() => listPromoCodes(), []);
  const { row, loading: rowLoading, error: rowError, missing } = useAdminRow<AdminPromoCodeRow>(
    id,
    load,
    getKey
  );

  const fields = useMemo<FieldSpec[]>(
    () => [
      {
        name: "code",
        label: "Kode Promo",
        kind: "text",
        wide: true,
        placeholder: "HEMAT50",
        hint: "3-32 karakter: huruf kapital, angka, - atau _",
      },
      { name: "title", label: "Judul Promo", kind: "text", wide: true },
      {
        name: "type",
        label: "Jenis Diskon",
        kind: "select",
        allowEmpty: false,
        options: [
          { value: "percentage", label: "Persentase (%)" },
          { value: "fixed", label: "Nominal tetap (USD)" },
        ],
      },
      {
        name: "valuePercent",
        label: "Diskon (%)",
        kind: "number",
        visibleWhen: { name: "type", equals: "percentage" },
        hint: "0-100",
      },
      {
        name: "valueUsdCents",
        label: "Potongan Tetap",
        kind: "money",
        visibleWhen: { name: "type", equals: "fixed" },
        hint: "Nilai dalam USD, disimpan sebagai sen",
      },
      {
        name: "minTotalUsdCents",
        label: "Minimum Belanja",
        kind: "money",
        hint: "Kosongkan atau 0 tanpa minimum",
      },
      { name: "usageLimit", label: "Batas Pemakaian", kind: "number" },
      { name: "startsAt", label: "Mulai Berlaku", kind: "datetime" },
      { name: "endsAt", label: "Berakhir Berlaku", kind: "datetime" },
      { name: "active", label: "Aktif", kind: "toggle" },
    ],
    []
  );

  const initialValues = useMemo<FieldValues>(
    () => ({
      code: row?.code ?? "",
      title: row?.title ?? "",
      type: row?.type ?? "percentage",
      valuePercent: row?.type === "percentage" ? row.value : 0,
      valueUsdCents: row?.type === "fixed" ? row.value : 0,
      minTotalUsdCents: row?.minTotalUsdCents ?? 0,
      usageLimit: row?.usageLimit ?? null,
      startsAt: toLocalInput(row?.startsAt ?? null),
      endsAt: toLocalInput(row?.endsAt ?? null),
      active: row?.active ?? true,
    }),
    [row]
  );

  return (
    <EntityFormPage
      table="promoCode"
      id={id}
      title={mode === "edit" ? "Edit Promo" : "Tambah Promo"}
      subtitle="Potongan harga untuk customer — nominal tetap atau persentase."
      listPath={LIST_PATH}
      listLabel="Promo"
      fields={fields}
      initialValues={initialValues}
      loading={rowLoading}
      loadError={rowError}
      rowMissing={missing}
      entityName={row?.code ?? null}
    />
  );
}
