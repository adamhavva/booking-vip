import { Suspense } from "react";
import type { Metadata } from "next";
import PlacesForm from "../PlacesForm";

export const metadata: Metadata = {
  title: "Edit Place · Admin",
  robots: { index: false, follow: false },
};

/**
 * The edit page of the Place catalog.
 *
 * The record id comes from the URL, so it is read inside a `<Suspense>`
 * boundary: with Cache Components enabled a URL read outside a boundary
 * blocks the instant navigation shell.
 */
export default function AdminPlacesEditPage(
  props: PageProps<"/admin/catalog/places/[id]">
) {
  return (
    <Suspense fallback={<AdminPlacesEditFallback />}>
      <AdminPlacesEditForm {...props} />
    </Suspense>
  );
}

/** Reads the id and renders the form. */
async function AdminPlacesEditForm(
  props: PageProps<"/admin/catalog/places/[id]">
) {
  const { id } = await props.params;
  return <PlacesForm mode="edit" id={id} />;
}

/** Shown while the id is being resolved. */
function AdminPlacesEditFallback() {
  return (
    <div className="rounded-lg border border-[var(--admin-line)] px-6 py-12 text-center text-[13px] text-[var(--admin-muted)]">
      Memuat data…
    </div>
  );
}
