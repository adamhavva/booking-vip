import type { Metadata } from "next";
import ServiceLayout from "@/components/sections/ServiceLayout";
import { servicePages } from "@/data/services";

const service = servicePages["vip-service"];

export const metadata: Metadata = {
  title: `${service.title} - Booking VIP`,
  description: service.intro,
};

export default function VipServicePage() {
  return <ServiceLayout service={service} />;
}
