import type { Metadata } from "next";
import AmenitiesForm from "../AmenitiesForm";

export const metadata: Metadata = {
  title: "Tambah Amenity · Admin",
  robots: { index: false, follow: false },
};

export default function AdminAmenitiesNewPage() {
  return <AmenitiesForm mode="create" />;
}
