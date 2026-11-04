"use client";

import { useState, type ReactNode } from "react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import TabPills from "@/components/ui/TabPills";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { DictKey } from "@/i18n";

export default function SectionBand({
  title,
  eyebrow,
  emoji,
  tabs,
  seeAll = "See all",
  seeAllHref = "#",
  children,
  className = "",
  // i18n keys — when provided, they override the literal props above
  titleKey,
  eyebrowKey,
  seeAllKey,
}: {
  title: string;
  eyebrow?: string;
  emoji?: string;
  tabs?: string[];
  seeAll?: string | null;
  seeAllHref?: string;
  children: ReactNode;
  className?: string;
  titleKey?: DictKey;
  eyebrowKey?: DictKey;
  seeAllKey?: DictKey;
}) {
  const { t } = useLocale();
  const [active, setActive] = useState(0);

  const resolvedTitle = titleKey ? t(titleKey) : title;
  const resolvedEyebrow = eyebrowKey ? t(eyebrowKey) : eyebrow;
  const resolvedSeeAll = seeAllKey ? t(seeAllKey) : seeAll;

  return (
    <Container as="section" className={`py-6 ${className}`}>
      <SectionHeading
        eyebrow={resolvedEyebrow}
        title={resolvedTitle}
        emoji={emoji}
        seeAll={resolvedSeeAll || undefined}
        seeAllHref={seeAllHref}
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