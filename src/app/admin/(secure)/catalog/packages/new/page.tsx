import type { Metadata } from "next";
import PackagesForm from "../PackagesForm";

export const metadata: Metadata = {
  title: "Tambah Paket · Admin",
  robots: { index: false, follow: false },
};

export default function AdminPackagesNewPage() {
  return <PackagesForm mode="create" />;
}
