"use client";

import { useEffect, useMemo, useState } from "react";
import Container from "@/components/ui/Container";
import TabPills from "@/components/ui/TabPills";
import {
  EvoaCard,
  ProductCard,
  TourCard,
  TransportCard,
  VipServiceCard,
} from "@/components/cards";
import { evoaPlans, tours, transports, vipServices } from "@/data/home";
import type { CatalogDTO, ProductCardDTO, ServiceCatalogKind } from "@/types";
import { getCatalog } from "@/app/actions/catalog";
import { useLocale } from "@/components/providers/LocaleProvider";

/** Map ServiceCatalogKind to the DB lineSlug */
const KIND_TO_LINE_SLUG: Record<ServiceCatalogKind, string> = {
  vip: "vip-service",
  transport: "transport",
  tour: "tour-package",
  evoa: "evoa",
};

type SortMode = "recommended" | "price-asc" | "price-desc";

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
 * Filterable catalog of the service's products.
 * Fetches from DB on mount; falls back to static data on error.
 */
export default function ServiceCatalog({
  kind,
  tabs,
}: {
  kind: ServiceCatalogKind;
  tabs: string[];
}) {
  const { t } = useLocale();
  const [catalog, setCatalog] = useState<CatalogDTO | null>(null);
  const [typeIdx, setTypeIdx] = useState(0);
  const [placeIdx, setPlaceIdx] = useState(0);
  const [priceIdx, setPriceIdx] = useState(0);
  const [sort, setSort] = useState<SortMode>("recommended");

  // Fetch catalog from DB on mount
  useEffect(() => {
    const lineSlug = KIND_TO_LINE_SLUG[kind];
    getCatalog(lineSlug).then((data) => setCatalog(data));
  }, [kind]);

  // DB-backed facets
  const serviceTypeTabs = useMemo(() => {
    if (!catalog) return tabs;
    return ["All", ...catalog.serviceTypes.map((t) => t.name)];
  }, [catalog, tabs]);

  const placeTabs = useMemo(() => {
    if (!catalog) return ["All"];
    return ["All", ...catalog.places.map((p) => p.name)];
  }, [catalog]);

  const priceTabs = useMemo(() => {
    if (!catalog) return ["All"];
    return ["All", ...catalog.priceTiers.map((t) => `Up to $${t.maxUsd}`)];
  }, [catalog]);

  // Filter and sort DB products
  const filteredProducts = useMemo(() => {
    if (!catalog) return [];

    let products = catalog.products;

    // Filter by service type
    const typeTab = serviceTypeTabs[typeIdx] ?? "All";
    if (typeTab !== "All") {
      products = products.filter((p) => p.serviceTypeName === typeTab);
    }

    // Filter by place
    const placeTab = placeTabs[placeIdx] ?? "All";
    if (placeTab !== "All") {
      products = products.filter((p) => p.placeName === placeTab);
    }

    // Filter by price tier
    const priceTab = priceTabs[priceIdx] ?? "All";
    if (priceTab !== "All") {
      const tier = catalog.priceTiers.find((t) => `Up to $${t.maxUsd}` === priceTab);
      if (tier) {
        products = products.filter((p) => p.priceUsd <= tier.maxUsd);
      }
    }

    // Sort
    if (sort === "price-asc") {
      products = [...products].sort((a, b) => a.priceUsd - b.priceUsd);
    } else if (sort === "price-desc") {
      products = [...products].sort((a, b) => b.priceUsd - a.priceUsd);
    }

    return products;
  }, [catalog, typeIdx, placeIdx, priceIdx, sort, serviceTypeTabs, placeTabs, priceTabs]);

  // Fallback static items
  const tab = serviceTypeTabs[typeIdx] ?? "All";
  const lineSlug = KIND_TO_LINE_SLUG[kind];

  const staticItems = useMemo(() => {
    const c = CATALOGS[kind];
    return tab === "All" ? c.items() : c.filter(tab);
  }, [kind, tabs, typeIdx, tab]);

  // If DB data loaded, render DB-backed cards
  if (catalog) {
    return (
      <Container as="section" className="py-8">
        <h2 className="mb-4 text-xl font-extrabold text-ink md:text-2xl">
          {t("catalog.availableOptions")}
        </h2>

        {/* Service Type facets */}
        {catalog.serviceTypes.length > 0 && (
          <TabPills
            items={serviceTypeTabs}
            active={typeIdx}
            onChange={setTypeIdx}
            variant="bordered"
            className="mb-3"
          />
        )}

        {/* Place facets */}
        {catalog.places.length > 0 && (
          <TabPills
            items={placeTabs}
            active={placeIdx}
            onChange={setPlaceIdx}
            variant="bordered"
            className="mb-3"
          />
        )}

        {/* Price tier facets + sort */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {catalog.priceTiers.length > 0 && (
            <TabPills
              items={priceTabs}
              active={priceIdx}
              onChange={setPriceIdx}
              variant="bordered"
            />
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="ml-auto rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-semibold text-ink"
          >
            <option value="recommended">{t("catalog.recommended")}</option>
            <option value="price-asc">{t("catalog.priceLowHigh")}</option>
            <option value="price-desc">{t("catalog.priceHighLow")}</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-4">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.slug}
              product={p}
              href={`/${lineSlug}/${p.slug}`}
            />
          ))}
        </div>
      </Container>
    );
  }

  // Fallback: render static data while loading or on error
  return (
    <Container as="section" className="py-8">
      <h2 className="mb-4 text-xl font-extrabold text-ink md:text-2xl">
        {t("catalog.availableOptions")}
      </h2>

      <TabPills
        items={tabs}
        active={typeIdx}
        onChange={setTypeIdx}
        variant="bordered"
        className="mb-5"
      />

      <div className="flex flex-wrap gap-4">{staticItems}</div>
    </Container>
  );
}
