import { Suspense } from "react";
import type { Metadata } from "next";
import AmenitiesForm from "../AmenitiesForm";

export const metadata: Metadata = {
  title: "Edit Amenity · Admin",
  robots: { index: false, follow: false },
};

/**
 * The edit page of the Amenity catalog.
 *
 * The record id comes from the URL, so it is read inside a `<Suspense>`
 * boundary: with Cache Components enabled a URL read outside a boundary
 * blocks the instant navigation shell.
 */
export default function AdminAmenitiesEditPage(
  props: PageProps<"/admin/catalog/amenities/[id]">
) {
  return (
    <Suspense fallback={<AdminAmenitiesEditFallback />}>
      <AdminAmenitiesEditForm {...props} />
    </Suspense>
  );
}

/** Reads the id and renders the form. */
async function AdminAmenitiesEditForm(
  props: PageProps<"/admin/catalog/amenities/[id]">
) {
  const { id } = await props.params;
  return <AmenitiesForm mode="edit" id={id} />;
}

/** Shown while the id is being resolved. */
function AdminAmenitiesEditFallback() {
  return (
    <div className="rounded-lg border border-[var(--admin-line)] px-6 py-12 text-center text-[13px] text-[var(--admin-muted)]">
      Memuat data…
    </div>
  );
}
