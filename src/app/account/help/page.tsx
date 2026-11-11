import type { Metadata } from "next";
import Link from "next/link";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import ComingSoon from "@/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "Bantuan · Booking VIP",
  description: "Pusat bantuan Booking VIP.",
};

/** The help centre — still being written. */
export default function AccountHelpPage() {
  return (
    <div>
      <AccountPageHeader
        title="Bantuan"
        description="Pusat bantuan customer service Booking VIP."
      />

      <ComingSoon
        title="Pusat bantuan segera hadir"
        description="Tim kami sedang menyiapkan pusat bantuan lengkap — FAQ, panduan pemesanan, dan kontak WhatsApp kami."
        action={
          <Link
            href="/account"
            className="inline-flex h-10 items-center rounded-lg border border-line bg-white px-4 text-[13px] font-medium text-ink transition-colors hover:bg-canvas"
          >
            Kembali ke pusat akun
          </Link>
        }
      />
    </div>
  );
}
