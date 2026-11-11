import type { Metadata } from "next";
import PromosManager from "./PromosManager";

export const metadata: Metadata = {
  title: "Promo · Admin",
  robots: { index: false, follow: false },
};

export default function AdminPromosPage() {
  return <PromosManager />;
}
