"use client";

import { useState, type ReactNode } from "react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import TabPills from "@/components/ui/TabPills";

export default function SectionBand({
  title,
  eyebrow,
  emoji,
  tabs,
  seeAll = "See all",
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  emoji?: string;
  tabs?: string[];
  seeAll?: string | null;
  children: ReactNode;
  className?: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <Container as="section" className={`py-6 ${className}`}>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        emoji={emoji}
        seeAll={seeAll || undefined}
      />

      {tabs && tabs.length > 0 && (
        <TabPills
          items={tabs}
          active={active}
          onChange={setActive}
          variant="bordered"
          className="mb-4"
        />
      )}

      {children}
    </Container>
  );
}