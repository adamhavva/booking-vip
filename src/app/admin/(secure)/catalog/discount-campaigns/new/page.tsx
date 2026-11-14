import type { Metadata } from "next";
import DiscountCampaignsForm from "../DiscountCampaignsForm";

export const metadata: Metadata = {
  title: "Tambah Kampanye Diskon · Admin",
  robots: { index: false, follow: false },
};

export default function AdminDiscountCampaignsNewPage() {
  return <DiscountCampaignsForm mode="create" />;
}