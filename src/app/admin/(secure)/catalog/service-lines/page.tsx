import type { Metadata } from "next";
import ServiceLinesManager from "./ServiceLinesManager";

export const metadata: Metadata = {
  title: "Service Line · Admin",
  robots: { index: false, follow: false },
};

export default function AdminServiceLinesPage() {
  return <ServiceLinesManager />;
}
