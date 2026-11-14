"use client";

import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import TabPills from "@/components/ui/TabPills";
import { serviceNav } from "@/data/services";
import { useMountedLocale } from "@/lib/useMountedLocale";
import { pickLang } from "@/lib/content";
import { tabKey } from "@/lib/serviceLabels";
import type { DictKey } from "@/i18n";

export type SeoLink = {
  label: string;
  /** Indonesian label (DB `SeoLink.labelId`) — English is used when absent. */
  labelId?: string | null;
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
  titleKey,
}: {
  title: string;
  tabs: string[];
  links: SeoLink[];
  titleKey?: DictKey;
}) {
  const { t, lang } = useMountedLocale();
  const [active, setActive] = useState(0);

  const resolvedTitle = titleKey ? t(titleKey) : title;
  const resolvedTabs = tabs.map((tab) => {
    const key = tabKey(tab);
    return key ? t(key) : tab;
  });

  return (
    <Container as="section" className="py-8">
      <h2 className="mb-4 text-xl font-extrabold text-ink md:text-2xl">
        {resolvedTitle}
      </h2>

      <TabPills
        items={resolvedTabs}
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
            {pickLang(l.label, l.labelId, lang)}
          </Link>
        ))}
      </div>
    </Container>
  );
}
