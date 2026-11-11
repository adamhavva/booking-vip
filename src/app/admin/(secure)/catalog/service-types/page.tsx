import type { Metadata } from "next";
import ServiceTypesManager from "./ServiceTypesManager";

export const metadata: Metadata = {
  title: "Tipe Layanan · Admin",
  robots: { index: false, follow: false },
};

export default function AdminServiceTypesPage() {
  return <ServiceTypesManager />;
}
