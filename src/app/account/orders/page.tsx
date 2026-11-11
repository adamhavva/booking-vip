import type { Metadata } from "next";
import OrdersPanel from "@/components/account/OrdersPanel";

export const metadata: Metadata = {
  title: "Pesanan · Booking VIP",
  description: "Riwayat pesanan dan invoice Booking VIP.",
};

/** The order history page of the account area. */
export default function AccountOrdersPage() {
  return <OrdersPanel />;
}
