import { Suspense } from "react";
import type { Metadata } from "next";
import ProductsForm from "../ProductsForm";

export const metadata: Metadata = {
  title: "Edit Produk · Admin",
  robots: { index: false, follow: false },
};

/**
 * The edit page of the Produk catalog.
 *
 * The record id comes from the URL, so it is read inside a `<Suspense>`
 * boundary: with Cache Components enabled a URL read outside a boundary
 * blocks the instant navigation shell.
 */
export default function AdminProductsEditPage(
  props: PageProps<"/admin/catalog/products/[id]">
) {
  return (
    <Suspense fallback={<AdminProductsEditFallback />}>
      <AdminProductsEditForm {...props} />
    </Suspense>
  );
}

/** Reads the id and renders the form. */
async function AdminProductsEditForm(
  props: PageProps<"/admin/catalog/products/[id]">
) {
  const { id } = await props.params;
  return <ProductsForm mode="edit" id={id} />;
}

/** Shown while the id is being resolved. */
function AdminProductsEditFallback() {
  return (
    <div className="rounded-lg border border-[var(--admin-line)] px-6 py-12 text-center text-[13px] text-[var(--admin-muted)]">
      Memuat data…
    </div>
  );
}
