import type { Metadata } from "next";
import ServiceLinesForm from "../ServiceLinesForm";

export const metadata: Metadata = {
  title: "Tambah Service Line · Admin",
  robots: { index: false, follow: false },
};

export default function AdminServiceLinesNewPage() {
  return <ServiceLinesForm mode="create" />;
}
