"use client";

import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import TabPills from "@/components/ui/TabPills";
import { serviceNav } from "@/data/services";

export type SeoLink = {
  label: string;
  service: string;
  tags?: string[];
};

const serviceRoutes = Object.fromEntries(
  serviceNav.map((s) => [s.label, s.href])
);

export default function SeoLinkGrid({
  title,
  tabs,
  links,
}: {
  title: string;
  tabs: string[];
  links: SeoLink[];
}) {
  const [active, setActive] = useState(0);

  return (
    <Container as="section" className="py-8">
      <h2 className="mb-4 text-xl font-extrabold text-ink md:text-2xl">
        {title}
      </h2>

      <TabPills
        items={tabs}
        active={active}
        onChange={setActive}
        variant="filled"
        className="mb-5 border-b border-line pb-3"
      />

      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 md:grid-cols-4">
        {links.map((l) => (
          <Link
            key={l.label}
            href={serviceRoutes[l.service] ?? "#"}
            className="text-sm text-muted hover:text-brand hover:underline"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </Container>
  );
}
