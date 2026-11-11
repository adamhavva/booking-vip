import type { Metadata } from "next";
import AccountHub from "@/components/account/AccountHub";

export const metadata: Metadata = {
  title: "Pusat Akun · Booking VIP",
  description: "Pusat akun Booking VIP — profil, poin, pembayaran, review dan pesanan.",
};

/** The account hub — the landing page of the customer account area. */
export default function AccountPage() {
  return <AccountHub />;
}
