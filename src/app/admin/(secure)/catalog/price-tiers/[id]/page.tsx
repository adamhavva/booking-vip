import { Suspense } from "react";
import type { Metadata } from "next";
import PriceTiersForm from "../PriceTiersForm";

export const metadata: Metadata = {
  title: "Edit Price Tier · Admin",
  robots: { index: false, follow: false },
};

/**
 * The edit page of the Price Tier catalog.
 *
 * The record id comes from the URL, so it is read inside a `<Suspense>`
 * boundary: with Cache Components enabled a URL read outside a boundary
 * blocks the instant navigation shell.
 */
export default function AdminPriceTiersEditPage(
  props: PageProps<"/admin/catalog/price-tiers/[id]">
) {
  return (
    <Suspense fallback={<AdminPriceTiersEditFallback />}>
      <AdminPriceTiersEditForm {...props} />
    </Suspense>
  );
}

/** Reads the id and renders the form. */
async function AdminPriceTiersEditForm(
  props: PageProps<"/admin/catalog/price-tiers/[id]">
) {
  const { id } = await props.params;
  return <PriceTiersForm mode="edit" id={id} />;
}

/** Shown while the id is being resolved. */
function AdminPriceTiersEditFallback() {
  return (
    <div className="rounded-lg border border-[var(--admin-line)] px-6 py-12 text-center text-[13px] text-[var(--admin-muted)]">
      Memuat data…
    </div>
  );
}
