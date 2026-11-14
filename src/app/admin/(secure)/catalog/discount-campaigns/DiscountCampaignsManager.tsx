"use client";

import { useCallback } from "react";
import {
  deleteCampaign,
  listCampaigns,
  type CampaignRow,
} from "@/app/actions/promo";
import EntityManager from "@/components/admin/EntityManager";
import { adminClass } from "@/components/admin/tokens";
import { useAdminList } from "@/components/admin/useAdminList";
import { useLocale } from "@/components/providers/LocaleProvider";

/**
 * Stacked discount campaigns ("diskon akumulasi").
 *
 * The percent column is the **averaged** discount of the member products,
 * recomputed by the server on every read — 50% + 60% shows 55%, never 110%.
 */
export default function DiscountCampaignsManager() {
  const { t } = useLocale();
  const load = useCallback(() => listCampaigns(), []);
  const { rows, loading, error, reload } = useAdminList<CampaignRow>(load);

  const columns = [
    {
      key: "name",
      header: t("admin.campaigns.name"),
      render: (row: CampaignRow) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: "line",
      header: t("admin.campaigns.line"),
      render: (row: CampaignRow) => <span>{row.lineLabel}</span>,
    },
    {
      key: "members",
      header: t("admin.campaigns.memberCount"),
      className: "text-right",
      render: (row: CampaignRow) => (
        <span className="tabular-nums text-[var(--admin-muted)]">{row.memberCount}</span>
      ),
    },
    {
      key: "percent",
      header: t("admin.campaigns.percent"),
      className: "text-right",
      render: (row: CampaignRow) => (
        <span className="tabular-nums font-medium">{row.percent}%</span>
      ),
    },
    {
      key: "active",
      header: t("admin.campaigns.status"),
      className: "text-right",
      render: (row: CampaignRow) => (
        <span className={`${adminClass.pill} ${row.active ? adminClass.pillOn : adminClass.pillOff}`}>
          {row.active ? t("admin.campaigns.on") : t("admin.campaigns.off")}
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
        getKey={(row) => row.key}
        createHref="/admin/catalog/discount-campaigns/new"
        editHref={(row) => `/admin/catalog/discount-campaigns/${row.key}`}
        nameOf={(row) => row.name}
        itemLabel={t("admin.campaigns.itemLabel")}
        onDelete={async (row, typedName) => {
          const result = await deleteCampaign({
            key: row.key,
            confirmName: typedName,
          });
          if (result.ok) reload();
          return result;
        }}
        createLabel={t("admin.campaigns.create")}
        editLabel={t("admin.campaigns.edit")}
        emptyTitle={t("admin.campaigns.emptyTitle")}
        emptyDescription={t("admin.campaigns.emptyDescription")}
        loading={loading}
      />
    </div>
  );
}