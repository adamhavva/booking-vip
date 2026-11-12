import type { Metadata } from "next";
import TaxSettingsManager from "./TaxSettingsManager";

export const metadata: Metadata = {
  title: "Pajak · Admin",
  robots: { index: false, follow: false },
};

/** The tax settings — key/value pairs applied to every booking subtotal. */
export default function AdminTaxSettingsPage() {
  return <TaxSettingsManager />;
}
