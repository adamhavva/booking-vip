"use client";

import { useState } from "react";
import Container from "@/components/ui/Container";
import TabPills from "@/components/ui/TabPills";

export default function SeoLinkGrid({
  title,
  tabs,
  links,
}: {
  title: string;
  tabs: string[];
  links: string[];
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
          <a
            key={l}
            href="#"
            className="text-sm text-muted hover:text-brand hover:underline"
          >
            {l}
          </a>
        ))}
      </div>
    </Container>
  );
}