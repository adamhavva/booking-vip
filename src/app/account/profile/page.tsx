import type { Metadata } from "next";
import ProfilePanel from "@/components/account/ProfilePanel";

export const metadata: Metadata = {
  title: "Profil Saya · Booking VIP",
  description: "Informasi akun dan pengaturan keamanan.",
};

/** The profile page of the account area. */
export default function AccountProfilePage() {
  return <ProfilePanel />;
}
