import type { Metadata } from "next";
import ServiceLayout from "@/components/sections/ServiceLayout";
import { servicePages } from "@/data/services";

const service = servicePages["tour-package"];

export const metadata: Metadata = {
  title: `${service.title} - Booking VIP`,
  description: service.intro,
};

export default function TourPackagePage() {
  return <ServiceLayout service={service} />;
}
