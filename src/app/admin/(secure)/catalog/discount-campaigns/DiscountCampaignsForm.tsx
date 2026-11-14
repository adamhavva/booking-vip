"use client";

import { useCallback, useMemo } from "react";
import {
  getCampaignReference,
  listCampaigns,
  saveCampaign,
  type CampaignReference,
  type CampaignRow,
} from "@/app/actions/promo";
import EntityFormPage from "@/components/admin/EntityFormPage";
import type { FieldSpec, FieldValues } from "@/components/admin/fields";
import { adminClass } from "@/components/admin/tokens";
import { useAdminRow, useAdminValue } from "@/components/admin/useAdminList";
import { useLocale } from "@/components/providers/LocaleProvider";
import { stackedDiscountPercent } from "@/lib/discount";

const LIST_PATH = "/admin/catalog/discount-campaigns";

const getKey = (row: CampaignRow) => row.key;

/**
 * The campaign form — shared by the create page and the edit page.
 *
 * The product picker is scoped to the chosen service line, and a live chip
 * under the fields shows the **averaged** discount of the selected products.
 * The chip runs the same pure helper (`stackedDiscountPercent`) as the
 * server readers, so the preview can never disagree with the stored result.
 */
export default function DiscountCampaignsForm({
  mode,
  id,
}: {
  mode: "create" | "edit";
  id?: string;
}) {
  const { t } = useLocale();

  const load = useCallback(() => listCampaigns(), []);
  const { row, loading: rowLoading, error: rowError, missing } =
    useAdminRow<CampaignRow>(id, load, getKey);

  const loadReference = useCallback(() => getCampaignReference(), []);
  const { data: reference, loading: refLoading, error: refError } =
    useAdminValue<CampaignReference>(loadReference);

  /** Product options per line, each labelled with its own discount. */
  const productsByLine = useMemo(() => {
    const byLine: Record<string, { value: string; label: string }[]> = {};
    for (const product of reference?.products ?? []) {
      const list = byLine[product.lineSlug] ?? [];
      list.push({
        value: product.id,
        label: `${product.title} — ${product.percent}%`,
      });
      byLine[product.lineSlug] = list;
    }
    return byLine;
  }, [reference]);

  const productById = useMemo(
    () => new Map((reference?.products ?? []).map((p) => [p.id, p])),
    [reference],
  );

  const fields = useMemo<FieldSpec[]>(
    () => [
      {
        name: "name",
        label: t("admin.campaigns.name"),
        kind: "text",
        wide: true,
        placeholder: "Diskon Akumulasi VIP",
      },
      {
        name: "lineSlug",
        label: t("admin.campaigns.line"),
        kind: "select",
        allowEmpty: false,
        options: (reference?.lines ?? []).map((l) => ({
          value: l.slug,
          label: l.label,
        })),
        // Changing the line clears the product selection of the old line.
        clearsOnChange: ["productIds"],
      },
      {
        name: "productIds",
        label: t("admin.campaigns.products"),
        kind: "multiselect",
        wide: true,
        hint: t("admin.campaigns.productsHint"),
        optionsWhen: { name: "lineSlug", byValue: productsByLine },
      },
      { name: "active", label: t("admin.campaigns.active"), kind: "toggle" },
    ],
    [reference, productsByLine, t],
  );

  const initialValues = useMemo<FieldValues>(
    () => ({
      name: row?.name ?? "",
      lineSlug: row?.lineSlug ?? reference?.lines[0]?.slug ?? "",
      productIds: row?.productIds ?? [],
      active: row?.active ?? true,
    }),
    [row, reference],
  );

  /** The live preview chip — the same averaged math the server will store. */
  const renderPreview = (values: FieldValues) => {
    const lineSlug = typeof values.lineSlug === "string" ? values.lineSlug : "";
    const selected = Array.isArray(values.productIds)
      ? (values.productIds as string[])
      : [];
    const members = selected
      .map((pid) => productById.get(pid))
      .filter(
        (p): p is NonNullable<typeof p> => p != null && p.lineSlug === lineSlug,
      );
    const percent = stackedDiscountPercent(members);

    return (
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-[var(--admin-line)] bg-[var(--admin-hover)] px-4 py-3">
        <span className={adminClass.label}>{t("admin.campaigns.previewLabel")}</span>
        {members.length === 0 ? (
          <span className="text-[13px] text-[var(--admin-muted)]">
            {t("admin.campaigns.previewEmpty")}
          </span>
        ) : (
          <>
            <span
              data-testid="campaign-preview-percent"
              className="inline-flex items-center rounded-full bg-[var(--admin-accent)] px-2.5 py-0.5 text-[13px] font-semibold tabular-nums text-white"
            >
              {percent}%
            </span>
            <span className="text-[12px] tabular-nums text-[var(--admin-muted)]">
              ({members.map((m) => `${m.percent}%`).join(" + ")}) / {members.length} ={" "}
              {percent}%
            </span>
            <span className="text-[12px] text-[var(--admin-muted)]">
              {t("admin.campaigns.previewMembers", { n: members.length })}
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <EntityFormPage
      table="campaign"
      id={id}
      title={
        mode === "edit"
          ? t("admin.campaigns.editTitle")
          : t("admin.campaigns.createTitle")
      }
      subtitle={t("admin.campaigns.subtitle")}
      listPath={LIST_PATH}
      listLabel={t("admin.campaigns.listLabel")}
      fields={fields}
      initialValues={initialValues}
      loading={rowLoading || refLoading}
      loadError={rowError || refError}
      rowMissing={missing}
      entityName={row?.name ?? null}
      onSave={({ id: saveId, values }) => saveCampaign({ key: saveId, values })}
      renderPreview={renderPreview}
    />
  );
}