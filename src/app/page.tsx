import {
  ArticleCard,
  DestinationCard,
  EvoaCard,
  PromoCard,
  TourCard,
  TransportCard,
  VipServiceCard,
} from "@/components/cards";
import BottomTabBar from "@/components/sections/BottomTabBar";
import BannerStrip from "@/components/sections/BannerStrip";
import Footer from "@/components/sections/Footer";
import HeroSearch from "@/components/sections/HeroSearch";
import RecentSearches from "@/components/sections/RecentSearches";
import SectionBand from "@/components/sections/SectionBand";
import SeoContent from "@/components/sections/SeoContent";
import SeoLinkGrid from "@/components/sections/SeoLinkGrid";
// import StickyAppBanner from "@/components/sections/StickyAppBanner";
import Carousel from "@/components/ui/Carousel";
import Header from "@/components/layout/Header";
import {
  articles,
  destinations,
  evoaPlans,
  promos,
  promoTabs,
  recommendationLinks,
  recommendationTabs,
  serviceSeoLinks,
  serviceSeoTabs,
  tours,
  transports,
  vipServices,
} from "@/data/home";

export default function Home() {
  return (
    <div className="bg-white pb-20 lg:pb-0">
      <Header />
      <HeroSearch />
      <RecentSearches />

      {/* Special deals */}
      <SectionBand title="Special deals" emoji="🎉">
        <Carousel>
          {promos.map((p) => (
            <PromoCard key={p.title} promo={p} />
          ))}
        </Carousel>
      </SectionBand>

      {/* 1 — Airport VIP Service */}
      <SectionBand
        eyebrow="Airport VIP Service ✈️"
        title="Breeze through the airport"
        tabs={["All", "Meet & Greet", "Fast Track", "Lounge", "Porter"]}
        seeAll="See all VIP services"
        seeAllHref="/vip-service"
      >
        <Carousel>
          {vipServices.map((s) => (
            <VipServiceCard key={s.title} service={s} />
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
      />

      {/* 2 — Transport */}
      <SectionBand
        eyebrow="Transport 🚘"
        title="Private transfers & chauffeur service"
        tabs={["All", "Sedan", "SUV", "Van", "Limousine"]}
        seeAll="See all transport"
        seeAllHref="/transport"
      >
        <Carousel>
          {transports.map((t) => (
            <TransportCard key={t.model} item={t} />
          ))}
        </Carousel>
      </SectionBand>

      {/* 3 — Tour Package */}
      <SectionBand
        eyebrow="Tour Package 🗺️"
        title="Curated tours across Indonesia"
        tabs={["All", "Bali", "Labuan Bajo", "Yogyakarta", "Lombok", "Papua"]}
        seeAll="See all tours"
        seeAllHref="/tour-package"
      >
        <Carousel>
          {tours.map((t) => (
            <TourCard key={t.title} tour={t} />
          ))}
        </Carousel>
      </SectionBand>

      {/* Tour destinations */}
      <SectionBand title="Popular destinations" emoji="📌" seeAll="See all!">
        <Carousel>
          {destinations.map((d) => (
            <DestinationCard key={d.name} dest={d} />
          ))}
        </Carousel>
      </SectionBand>

      {/* 4 — eVOA */}
      <SectionBand
        eyebrow="eVOA 🛂"
        title="Electronic Visa on Arrival, made easy"
        tabs={["All", "Tourist", "Business", "Express", "Transit"]}
        seeAll="Check eligibility"
        seeAllHref="/evoa"
      >
        <Carousel>
          {evoaPlans.map((p) => (
            <EvoaCard key={p.name} plan={p} />
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
      />

      {/* Promos */}
      <SectionBand
        title="Check out the promos before you go"
        emoji="🤩"
        tabs={promoTabs}
        seeAll="See all promos"
      >
        <Carousel>
          {promos.map((p) => (
            <PromoCard key={"pr-" + p.title} promo={p} />
          ))}
        </Carousel>
      </SectionBand>

      {/* Corporate banner */}
      <BannerStrip
        title="Booking VIP for Corporate"
        subtitle="VIP travel management for your executives and guests"
        cta="Learn more"
        tone="from-slate-700 to-slate-900"
        compact
      />

      {/* Articles / guides */}
      <SectionBand title="Travel guides & tips" emoji="📖">
        <Carousel>
          {articles.map((a) => (
            <ArticleCard key={a.title} article={a} />
          ))}
        </Carousel>
      </SectionBand>

      {/* SEO content */}
      <SeoContent />

      {/* SEO link grids */}
      <SeoLinkGrid
        title="Our Recommendations"
        tabs={recommendationTabs}
        links={recommendationLinks}
      />
      <SeoLinkGrid
        title="Explore Our Services"
        tabs={serviceSeoTabs}
        links={serviceSeoLinks}
      />

      <Footer />
      <BottomTabBar />
      {/* <StickyAppBanner /> */}
    </div>
  );
}