import { Suspense } from "react";
import type { Metadata } from "next";
import ServiceTypesForm from "../ServiceTypesForm";

export const metadata: Metadata = {
  title: "Edit Tipe Layanan · Admin",
  robots: { index: false, follow: false },
};

/**
 * The edit page of the Tipe Layanan catalog.
 *
 * The record id comes from the URL, so it is read inside a `<Suspense>`
 * boundary: with Cache Components enabled a URL read outside a boundary
 * blocks the instant navigation shell.
 */
export default function AdminServiceTypesEditPage(
  props: PageProps<"/admin/catalog/service-types/[id]">
) {
  return (
    <Suspense fallback={<AdminServiceTypesEditFallback />}>
      <AdminServiceTypesEditForm {...props} />
    </Suspense>
  );
}

/** Reads the id and renders the form. */
async function AdminServiceTypesEditForm(
  props: PageProps<"/admin/catalog/service-types/[id]">
) {
  const { id } = await props.params;
  return <ServiceTypesForm mode="edit" id={id} />;
}

/** Shown while the id is being resolved. */
function AdminServiceTypesEditFallback() {
  return (
    <div className="rounded-lg border border-[var(--admin-line)] px-6 py-12 text-center text-[13px] text-[var(--admin-muted)]">
      Memuat data…
    </div>
  );
}
