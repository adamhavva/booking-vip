import type { Metadata } from "next";
import LoyaltyPanel from "@/components/account/LoyaltyPanel";

export const metadata: Metadata = {
  title: "Poin & Level · Booking VIP",
  description: "Poin dan level member Booking VIP.",
};

/** The points & level page of the account area. */
export default function AccountLoyaltyPage() {
  return <LoyaltyPanel />;
}
