import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import ServiceLayout from "@/components/sections/ServiceLayout";
import ServiceLayoutSkeleton from "@/components/sections/ServiceLayoutSkeleton";
import { getServiceLineContent } from "@/app/actions/content";
import { toServicePage } from "@/lib/servicePage";
import { servicePages } from "@/data/services";

const fallback = servicePages["vip-service"];

export const metadata: Metadata = {
  title: `${fallback.title} - Booking VIP`,
  description: fallback.intro,
};

/**
 * The Airport VIP Service index.
 *
 * The copy comes from the `ServiceLine` row; the read happens inside a
 * Suspense boundary because a DB read during prerender is not allowed under
 * `cacheComponents`.
 */
export default function VipServicePage() {
  return (
    <Suspense fallback={<ServiceLayoutSkeleton />}>
      <VipServiceBody />
    </Suspense>
  );
}

async function VipServiceBody() {
  await connection();

  const line = await getServiceLineContent("vip-service");
  return <ServiceLayout service={toServicePage("vip-service", line)} />;
}
