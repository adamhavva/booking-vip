import type { Metadata } from "next";
import ReviewsPanel from "@/components/account/ReviewsPanel";

export const metadata: Metadata = {
  title: "Review Saya · Booking VIP",
  description: "Komentar kamu di setiap tempat yang dikunjungi.",
};

/** The "Review Saya" page of the account area. */
export default function AccountReviewsPage() {
  return <ReviewsPanel />;
}
