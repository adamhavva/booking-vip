import type { Metadata } from "next";
import AmenitiesManager from "./AmenitiesManager";

export const metadata: Metadata = {
  title: "Amenity · Admin",
  robots: { index: false, follow: false },
};

export default function AdminAmenitiesPage() {
  return <AmenitiesManager />;
}
