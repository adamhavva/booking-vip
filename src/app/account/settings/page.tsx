import type { Metadata } from "next";
import SettingsPanel from "@/components/account/SettingsPanel";

export const metadata: Metadata = {
  title: "Pengaturan · Booking VIP",
  description: "Pengaturan akun, keamanan dan notifikasi Booking VIP.",
};

/** The settings page of the account area. */
export default function AccountSettingsPage() {
  return <SettingsPanel />;
}
