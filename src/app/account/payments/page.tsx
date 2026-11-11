import type { Metadata } from "next";
import PaymentsPanel from "@/components/account/PaymentsPanel";

export const metadata: Metadata = {
  title: "Metode Pembayaran · Booking VIP",
  description: "Kartu tersimpan, Xendit dan PayPal.",
};

/** The payment methods page of the account area. */
export default function AccountPaymentsPage() {
  return <PaymentsPanel />;
}
