import { Suspense } from "react";
import type { Metadata } from "next";
import DiscountCampaignsForm from "../DiscountCampaignsForm";

export const metadata: Metadata = {
  title: "Edit Kampanye Diskon · Admin",
  robots: { index: false, follow: false },
};

/**
 * The edit page of the discount campaigns.
 *
 * The record key comes from the URL, so it is read inside a `<Suspense>`
 * boundary: with Cache Components enabled a URL read outside a boundary
 * blocks the instant navigation shell.
 */
export default function AdminDiscountCampaignsEditPage(
  props: PageProps<"/admin/catalog/discount-campaigns/[id]">
) {
  return (
    <Suspense fallback={<AdminDiscountCampaignsEditFallback />}>
      <AdminDiscountCampaignsEditForm {...props} />
    </Suspense>
  );
}

/** Reads the key and renders the form. */
async function AdminDiscountCampaignsEditForm(
  props: PageProps<"/admin/catalog/discount-campaigns/[id]">
) {
  const { id } = await props.params;
  return <DiscountCampaignsForm mode="edit" id={id} />;
}

/** Shown while the key is being resolved. */
function AdminDiscountCampaignsEditFallback() {
  return (
    <div className="rounded-lg border border-[var(--admin-line)] px-6 py-12 text-center text-[13px] text-[var(--admin-muted)]">
      Memuat data…
    </div>
  );
}