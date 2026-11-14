import type { Metadata } from "next";
import DiscountCampaignsManager from "./DiscountCampaignsManager";

export const metadata: Metadata = {
  title: "Diskon Akumulasi · Admin",
  robots: { index: false, follow: false },
};

export default function AdminDiscountCampaignsPage() {
  return <DiscountCampaignsManager />;
}