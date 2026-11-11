import { Suspense } from "react";
import type { Metadata } from "next";
import PromosForm from "../PromosForm";

export const metadata: Metadata = {
  title: "Edit Promo · Admin",
  robots: { index: false, follow: false },
};

/**
 * The edit page of the Promo catalog.
 *
 * The record id comes from the URL, so it is read inside a `<Suspense>`
 * boundary: with Cache Components enabled a URL read outside a boundary
 * blocks the instant navigation shell.
 */
export default function AdminPromosEditPage(
  props: PageProps<"/admin/catalog/promos/[id]">
) {
  return (
    <Suspense fallback={<AdminPromosEditFallback />}>
      <AdminPromosEditForm {...props} />
    </Suspense>
  );
}

/** Reads the id and renders the form. */
async function AdminPromosEditForm(props: PageProps<"/admin/catalog/promos/[id]">) {
  const { id } = await props.params;
  return <PromosForm mode="edit" id={id} />;
}

/** Shown while the id is being resolved. */
function AdminPromosEditFallback() {
  return (
    <div className="rounded-lg border border-[var(--admin-line)] px-6 py-12 text-center text-[13px] text-[var(--admin-muted)]">
      Memuat data…
    </div>
  );
}
