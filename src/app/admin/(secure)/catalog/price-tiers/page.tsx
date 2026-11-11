import type { Metadata } from "next";
import PriceTiersManager from "./PriceTiersManager";

export const metadata: Metadata = {
  title: "Price Tier · Admin",
  robots: { index: false, follow: false },
};

export default function AdminPriceTiersPage() {
  return <PriceTiersManager />;
}
