import { Suspense } from "react";
import type { Metadata } from "next";
import PackagesForm from "../PackagesForm";

export const metadata: Metadata = {
  title: "Edit Paket · Admin",
  robots: { index: false, follow: false },
};

/**
 * The edit page of the Paket catalog.
 *
 * The record id comes from the URL, so it is read inside a `<Suspense>`
 * boundary: with Cache Components enabled a URL read outside a boundary
 * blocks the instant navigation shell.
 */
export default function AdminPackagesEditPage(
  props: PageProps<"/admin/catalog/packages/[id]">
) {
  return (
    <Suspense fallback={<AdminPackagesEditFallback />}>
      <AdminPackagesEditForm {...props} />
    </Suspense>
  );
}

/** Reads the id and renders the form. */
async function AdminPackagesEditForm(
  props: PageProps<"/admin/catalog/packages/[id]">
) {
  const { id } = await props.params;
  return <PackagesForm mode="edit" id={id} />;
}

/** Shown while the id is being resolved. */
function AdminPackagesEditFallback() {
  return (
    <div className="rounded-lg border border-[var(--admin-line)] px-6 py-12 text-center text-[13px] text-[var(--admin-muted)]">
      Memuat data…
    </div>
  );
}
