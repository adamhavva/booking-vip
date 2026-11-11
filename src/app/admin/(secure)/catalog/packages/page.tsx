import type { Metadata } from "next";
import PackagesManager from "./PackagesManager";

export const metadata: Metadata = {
  title: "Paket · Admin",
  robots: { index: false, follow: false },
};

export default function AdminPackagesPage() {
  return <PackagesManager />;
}
