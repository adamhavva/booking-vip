"use client";

import { useMemo, useState } from "react";
import Container from "@/components/ui/Container";
import TabPills from "@/components/ui/TabPills";
import {
  EvoaCard,
  TourCard,
  TransportCard,
  VipServiceCard,
} from "@/components/cards";
import { evoaPlans, tours, transports, vipServices } from "@/data/home";
import type { ServiceCatalogKind } from "@/types";

/** Free-text match of an item against the active filter tab. */
function matches(tab: string, haystack: string[]): boolean {
  if (tab === "All") return true;
  const t = tab.toLowerCase();
  return haystack.some((h) => h.toLowerCase().includes(t));
}

const CATALOGS: Record<
  ServiceCatalogKind,
  {
    tabs: string[];
    items: () => React.ReactNode;
    filter: (tab: string) => React.ReactNode;
  }
> = {
  vip: {
    tabs: ["All", "Meet & Greet", "Fast Track", "Lounge", "Porter"],
    items: () =>
      vipServices.map((s) => <VipServiceCard key={s.title} service={s} />),
    filter: (tab) =>
      vipServices
        .filter((s) => matches(tab, [s.title, s.desc]))
        .map((s) => <VipServiceCard key={s.title} service={s} />),
  },
  transport: {
    tabs: ["All", "Sedan", "SUV", "Van", "Limousine"],
    items: () =>
      transports.map((t) => <TransportCard key={t.model} item={t} />),
    filter: (tab) =>
      transports
        .filter((t) => matches(tab, [t.model, t.category]))
        .map((t) => <TransportCard key={t.model} item={t} />),
  },
  tour: {
    tabs: ["All", "Bali", "Labuan Bajo", "Yogyakarta", "Lombok", "Papua"],
    items: () => tours.map((t) => <TourCard key={t.title} tour={t} />),
    filter: (tab) =>
      tours
        .filter((t) => matches(tab, [t.title, t.location]))
        .map((t) => <TourCard key={t.title} tour={t} />),
  },
  evoa: {
    tabs: ["All", "Tourist", "Business", "Express", "Transit"],
    items: () => evoaPlans.map((p) => <EvoaCard key={p.name} plan={p} />),
    filter: (tab) =>
      evoaPlans
        .filter((p) => matches(tab, [p.name, p.destination]))
        .map((p) => <EvoaCard key={p.name} plan={p} />),
  },
};

/**
 * Filterable catalog of the service's products, reusing the home cards.
 */
export default function ServiceCatalog({
  kind,
  tabs,
}: {
  kind: ServiceCatalogKind;
  tabs: string[];
}) {
  const [active, setActive] = useState(0);
  const tab = tabs[active] ?? "All";

  const items = useMemo(() => {
    const c = CATALOGS[kind];
    return tab === "All" ? c.items() : c.filter(tab);
  }, [kind, tab]);

  return (
    <Container as="section" className="py-8">
      <h2 className="mb-4 text-xl font-extrabold text-ink md:text-2xl">
        Available options
      </h2>

      <TabPills
        items={tabs}
        active={active}
        onChange={setActive}
        variant="bordered"
        className="mb-5"
      />

      <div className="flex flex-wrap gap-4">{items}</div>
    </Container>
  );
}
