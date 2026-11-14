import { Suspense } from "react";
import { connection } from "next/server";
import {
  ArticleCard,
  DestinationCard,
  PromoCard,
  ProductCard,
} from "@/components/cards";
import BottomTabBar from "@/components/sections/BottomTabBar";
import BannerStrip from "@/components/sections/BannerStrip";
import Footer from "@/components/sections/Footer";
import HeroSearch from "@/components/sections/HeroSearch";
import HomePopup from "@/components/sections/HomePopup";
import RecentSearches from "@/components/sections/RecentSearches";
import SectionBand from "@/components/sections/SectionBand";
import SeoContent from "@/components/sections/SeoContent";
import SeoLinkGrid from "@/components/sections/SeoLinkGrid";
// import StickyAppBanner from "@/components/sections/StickyAppBanner";
import Carousel from "@/components/ui/Carousel";
import Header from "@/components/layout/Header";
import { getHomeContent } from "@/app/actions/content";
import {
  recommendationLinks as staticRecommendationLinks,
  recommendationTabs as staticRecommendationTabs,
  serviceSeoLinks as staticServiceSeoLinks,
  serviceSeoTabs as staticServiceSeoTabs,
} from "@/data/home";
import type { CatalogDTO, CopyDTO, HomeContentDTO, SeoLinkDTO } from "@/types";

/**
 * Tabs of a service line — bilingual copy, DB-sourced with a static
 * (English-only) fallback. The active language is picked in the client
 * (`SectionBand`), so no DB read happens at prerender.
 */
function lineTabs(content: HomeContentDTO | null, slug: string, fallback: string[]): CopyDTO[] {
  const line = content?.lines.find((l) => l.slug === slug);
  if (!line || line.tabs.length === 0) return fallback.map((t) => ({ en: t, id: null }));
  return line.tabs;
}

/** The products of a line, straight from its DB-backed catalog. */
function lineProducts(content: HomeContentDTO | null, slug: string): CatalogDTO["products"] {
  return content?.catalogs[slug]?.products ?? [];
}

/** Bilingual links of a `SeoLink` group, in the shape `SeoLinkGrid` expects. */
function seoLinksOf(links: SeoLinkDTO[], group: string) {
  return links
    .filter((l) => l.group === group)
    .map((l) => ({ label: l.label.en, labelId: l.label.id, service: l.service ?? "", tags: l.tags }));
}

/** "All" + the distinct `service` values of a `SeoLink` group. */
function seoTabsOf(links: SeoLinkDTO[], group: string): string[] {
  const services = [...new Set(links.filter((l) => l.group === group).map((l) => l.service).filter((s): s is string => !!s))];
  return ["All", ...services];
}

/**
 * The home page.
 *
 * The shell (header, hero, footer) stays static; everything fed by the
 * database is streamed from `HomeBody` inside a Suspense boundary, because a
 * DB read during prerender is not allowed under `cacheComponents`.
 */
export default function Home() {
  return (
    <div className="bg-white pb-20 lg:pb-0">
      <Header />
      <HomePopup />
      <HeroSearch />
      <RecentSearches />

      <Suspense fallback={<HomeBodySkeleton />}>
        <HomeBody />
      </Suspense>

      <Footer />
      <BottomTabBar />
      {/* <StickyAppBanner /> */}
    </div>
  );
}

/** The placeholder shown while the DB-backed sections stream in. */
function HomeBodySkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-10 sm:px-6">
      {[0, 1, 2].map((row) => (
        <div key={row}>
          <div className="mb-4 h-6 w-64 rounded-lg bg-canvas" />
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((card) => (
              <div key={card} className="h-56 w-[260px] shrink-0 rounded-xl bg-canvas" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Everything on the home page that comes from the database. */
async function HomeBody() {
  await connection();

  const content = await getHomeContent();

  const vipProducts = lineProducts(content, "vip-service");
  const transportProducts = lineProducts(content, "transport");
  const tourProducts = lineProducts(content, "tour-package");
  const evoaProducts = lineProducts(content, "evoa");

  const promos = content && content.promos.length > 0 ? content.promos : [];
  const banners = content?.banners ?? [];
  const articles = content && content.articles.length > 0 ? content.articles : [];
  const destinations = content && content.destinations.length > 0 ? content.destinations : [];

  const recommendationLinks =
    content && content.seoLinks.length > 0
      ? seoLinksOf(content.seoLinks, "recommendations")
      : staticRecommendationLinks;
  const recommendationTabs =
    content && content.seoLinks.length > 0
      ? seoTabsOf(content.seoLinks, "recommendations")
      : staticRecommendationTabs;
  const serviceSeoLinks =
    content && content.seoLinks.length > 0
      ? seoLinksOf(content.seoLinks, "services")
      : staticServiceSeoLinks;
  const serviceSeoTabs =
    content && content.seoLinks.length > 0
      ? seoTabsOf(content.seoLinks, "services")
      : staticServiceSeoTabs;

  const [fastTrackBanner, evoaBanner, corporateBanner] = banners;

  // Promos are scoped to a service line, so the filter tabs are the lines.
  const promoTabs = ["All", ...(content?.lines.map((l) => l.label) ?? [])];

  return (
    <>
      {/* Special deals */}
      {promos.length > 0 ? (
        <SectionBand title="Special deals" emoji="🎉" titleKey="home.specialDeals" seeAllKey="section.seeAll">
          <Carousel>
            {promos.map((p) => (
              <PromoCard key={p.slug} promo={p} />
            ))}
          </Carousel>
        </SectionBand>
      ) : null}

      {/* 1 — Airport VIP Service */}
      <SectionBand
        eyebrow="Airport VIP Service ✈️"
        title="Breeze through the airport"
        tabsCopy={lineTabs(content, "vip-service", ["All", "Meet & Greet", "Fast Track", "Lounge", "Porter"])}
        seeAll="See all VIP services"
        seeAllHref="/vip-service"
        eyebrowKey="home.vipEyebrow"
        titleKey="home.vipTitle"
        seeAllKey="home.vipSeeAll"
      >
        <Carousel>
          {vipProducts.map((p) => (
            <ProductCard key={p.slug} product={p} href={`/vip-service/${p.slug}`} />
          ))}
        </Carousel>
      </SectionBand>

      {/* VIP banner */}
      <BannerStrip
        title="Skip the queues with Fast Track Immigration"
        subtitle="A dedicated greeter and priority lanes, from arrival to departure"
        cta="Book VIP"
        tone="from-sky-600 to-blue-800"
        compact
        titleKey="banner.fastTrackTitle"
        subtitleKey="banner.fastTrackSubtitle"
        ctaKey="banner.fastTrackCta"
        titleCopy={fastTrackBanner?.title}
        subtitleCopy={fastTrackBanner?.subtitle}
        ctaCopy={fastTrackBanner?.cta}
        imageUrl={fastTrackBanner?.imageUrl}
        href={fastTrackBanner?.ctaHref}
      />

      {/* 2 — Transport */}
      <SectionBand
        eyebrow="Transport 🚘"
        title="Private transfers & chauffeur service"
        tabsCopy={lineTabs(content, "transport", ["All", "Sedan", "SUV", "Van", "Limousine"])}
        seeAll="See all transport"
        seeAllHref="/transport"
        eyebrowKey="home.transportEyebrow"
        titleKey="home.transportTitle"
        seeAllKey="home.transportSeeAll"
      >
        <Carousel>
          {transportProducts.map((p) => (
            <ProductCard key={p.slug} product={p} href={`/transport/${p.slug}`} />
          ))}
        </Carousel>
      </SectionBand>

      {/* 3 — Tour Package */}
      <SectionBand
        eyebrow="Tour Package 🗺️"
        title="Curated tours across Indonesia"
        tabsCopy={lineTabs(content, "tour-package", ["All", "Bali", "Labuan Bajo", "Yogyakarta", "Lombok", "Papua"])}
        seeAll="See all tours"
        seeAllHref="/tour-package"
        eyebrowKey="home.tourEyebrow"
        titleKey="home.tourTitle"
        seeAllKey="home.tourSeeAll"
      >
        <Carousel>
          {tourProducts.map((p) => (
            <ProductCard key={p.slug} product={p} href={`/tour-package/${p.slug}`} />
          ))}
        </Carousel>
      </SectionBand>

      {/* Tour destinations */}
      {destinations.length > 0 ? (
        <SectionBand title="Popular destinations" emoji="📌" seeAll="See all!" titleKey="home.destinationsTitle" seeAllKey="home.destinationsSeeAll">
          <Carousel>
            {destinations.map((d) => (
              <DestinationCard key={d.slug} dest={d} />
            ))}
          </Carousel>
        </SectionBand>
      ) : null}

      {/* 4 — eVOA */}
      <SectionBand
        eyebrow="eVOA 🛂"
        title="Electronic Visa on Arrival, made easy"
        tabsCopy={lineTabs(content, "evoa", ["All", "Tourist", "Business", "Express", "Transit"])}
        seeAll="Check eligibility"
        seeAllHref="/evoa"
        eyebrowKey="home.evoaEyebrow"
        titleKey="home.evoaTitle"
        seeAllKey="home.evoaSeeAll"
      >
        <Carousel>
          {evoaProducts.map((p) => (
            <ProductCard key={p.slug} product={p} href={`/evoa/${p.slug}`} />
          ))}
        </Carousel>
      </SectionBand>

      {/* eVOA banner */}
      <BannerStrip
        title="Apply for your eVOA online in minutes"
        subtitle="No embassy visit — get approved and receive it by email"
        cta="Apply now"
        tone="from-violet-600 to-purple-800"
        compact
        titleKey="banner.evoaTitle"
        subtitleKey="banner.evoaSubtitle"
        ctaKey="banner.evoaCta"
        titleCopy={evoaBanner?.title}
        subtitleCopy={evoaBanner?.subtitle}
        ctaCopy={evoaBanner?.cta}
        imageUrl={evoaBanner?.imageUrl}
        href={evoaBanner?.ctaHref}
      />

      {/* Promos */}
      {promos.length > 0 ? (
        <SectionBand
          title="Check out the promos before you go"
          emoji="🤩"
          tabs={promoTabs}
          seeAll="See all promos"
          titleKey="home.promosTitle"
          seeAllKey="home.promosSeeAll"
        >
          <Carousel>
            {promos.map((p) => (
              <PromoCard key={`pr-${p.slug}`} promo={p} />
            ))}
          </Carousel>
        </SectionBand>
      ) : null}

      {/* Corporate banner */}
      <BannerStrip
        title="Booking VIP for Corporate"
        subtitle="VIP travel management for your executives and guests"
        cta="Learn more"
        tone="from-slate-700 to-slate-900"
        compact
        titleKey="banner.corporateTitle"
        subtitleKey="banner.corporateSubtitle"
        ctaKey="banner.corporateCta"
        titleCopy={corporateBanner?.title}
        subtitleCopy={corporateBanner?.subtitle}
        ctaCopy={corporateBanner?.cta}
        imageUrl={corporateBanner?.imageUrl}
        href={corporateBanner?.ctaHref}
      />

      {/* Articles / guides */}
      {articles.length > 0 ? (
        <SectionBand title="Travel guides & tips" emoji="📖" titleKey="home.articlesTitle" seeAllKey="section.seeAll">
          <Carousel>
            {articles.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </Carousel>
        </SectionBand>
      ) : null}

      {/* SEO content */}
      <SeoContent blocks={content?.seoBlocks} />

      {/* SEO link grids */}
      <SeoLinkGrid
        title="Our Recommendations"
        tabs={recommendationTabs}
        links={recommendationLinks}
        titleKey="home.recommendationsTitle"
      />
      <SeoLinkGrid
        title="Explore Our Services"
        tabs={serviceSeoTabs}
        links={serviceSeoLinks}
        titleKey="home.exploreServicesTitle"
      />
    </>
  );
}
