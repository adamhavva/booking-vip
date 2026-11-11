import { Suspense } from "react";
import type { Metadata } from "next";
import ServiceLinesForm from "../ServiceLinesForm";

export const metadata: Metadata = {
  title: "Edit Service Line · Admin",
  robots: { index: false, follow: false },
};

/**
 * The edit page of the Service Line catalog.
 *
 * The record id comes from the URL, so it is read inside a `<Suspense>`
 * boundary: with Cache Components enabled a URL read outside a boundary
 * blocks the instant navigation shell.
 */
export default function AdminServiceLinesEditPage(
  props: PageProps<"/admin/catalog/service-lines/[id]">
) {
  return (
    <Suspense fallback={<AdminServiceLinesEditFallback />}>
      <AdminServiceLinesEditForm {...props} />
    </Suspense>
  );
}

/** Reads the id and renders the form. */
async function AdminServiceLinesEditForm(
  props: PageProps<"/admin/catalog/service-lines/[id]">
) {
  const { id } = await props.params;
  return <ServiceLinesForm mode="edit" id={id} />;
}

/** Shown while the id is being resolved. */
function AdminServiceLinesEditFallback() {
  return (
    <div className="rounded-lg border border-[var(--admin-line)] px-6 py-12 text-center text-[13px] text-[var(--admin-muted)]">
      Memuat data…
    </div>
  );
}
