"use client";

import { useState, type ReactNode } from "react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import TabPills from "@/components/ui/TabPills";
import { useMountedLocale } from "@/lib/useMountedLocale";
import { copyText } from "@/lib/content";
import { tabKey } from "@/lib/serviceLabels";
import type { DictKey } from "@/i18n";
import type { CopyDTO } from "@/types";

export default function SectionBand({
  title,
  eyebrow,
  emoji,
  tabs,
  tabsCopy,
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
  /** Bilingual DB tabs — win over `tabs`; resolved in the active language. */
  tabsCopy?: CopyDTO[];
  seeAll?: string | null;
  seeAllHref?: string;
  children: ReactNode;
  className?: string;
  titleKey?: DictKey;
  eyebrowKey?: DictKey;
  seeAllKey?: DictKey;
}) {
  const { t, lang } = useMountedLocale();
  const [active, setActive] = useState(0);

  const resolvedTitle = titleKey ? t(titleKey) : title;
  const resolvedEyebrow = eyebrowKey ? t(eyebrowKey) : eyebrow;
  const resolvedSeeAll = seeAllKey ? t(seeAllKey) : seeAll;

  // Known labels ("All", service names) go through the dictionary; DB copy
  // is picked in the active language first, product terms pass through.
  const resolveTab = (label: string) => {
    const key = tabKey(label);
    return key ? t(key) : label;
  };
  const resolvedTabs = tabsCopy
    ? tabsCopy.map((c) => resolveTab(copyText(c, lang)))
    : tabs?.map(resolveTab);

  return (
    <Container as="section" className={`py-6 ${className}`}>
      <SectionHeading
        eyebrow={resolvedEyebrow}
        title={resolvedTitle}
        emoji={emoji}
        seeAll={resolvedSeeAll || undefined}
        seeAllHref={seeAllHref}
      />

      {resolvedTabs && resolvedTabs.length > 0 && (
        <TabPills
          items={resolvedTabs}
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