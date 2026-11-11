import type { Metadata } from "next";
import PlacesForm from "../PlacesForm";

export const metadata: Metadata = {
  title: "Tambah Place · Admin",
  robots: { index: false, follow: false },
};

export default function AdminPlacesNewPage() {
  return <PlacesForm mode="create" />;
}
