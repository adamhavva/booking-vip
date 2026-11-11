import type { Metadata } from "next";
import PlacesManager from "./PlacesManager";

export const metadata: Metadata = {
  title: "Place · Admin",
  robots: { index: false, follow: false },
};

export default function AdminPlacesPage() {
  return <PlacesManager />;
}
