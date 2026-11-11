import type { Metadata } from "next";
import PriceTiersForm from "../PriceTiersForm";

export const metadata: Metadata = {
  title: "Tambah Price Tier · Admin",
  robots: { index: false, follow: false },
};

export default function AdminPriceTiersNewPage() {
  return <PriceTiersForm mode="create" />;
}
