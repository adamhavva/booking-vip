import type { Metadata } from "next";
import PromosForm from "../PromosForm";

export const metadata: Metadata = {
  title: "Tambah Promo · Admin",
  robots: { index: false, follow: false },
};

export default function AdminPromosNewPage() {
  return <PromosForm mode="create" />;
}
