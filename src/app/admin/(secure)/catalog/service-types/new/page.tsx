import type { Metadata } from "next";
import ServiceTypesForm from "../ServiceTypesForm";

export const metadata: Metadata = {
  title: "Tambah Tipe Layanan · Admin",
  robots: { index: false, follow: false },
};

export default function AdminServiceTypesNewPage() {
  return <ServiceTypesForm mode="create" />;
}
