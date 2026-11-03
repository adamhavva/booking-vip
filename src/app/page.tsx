import Header from "@/components/Header";
import HeroSearch from "@/components/HeroSearch";
import SectionBand from "@/components/SectionBand";
import Carousel from "@/components/Carousel";
import BannerStrip from "@/components/BannerStrip";
import SeoContent from "@/components/SeoContent";
import SeoLinkGrid from "@/components/SeoLinkGrid";
import Footer from "@/components/Footer";
// import StickyAppBanner from "@/components/StickyAppBanner";
import BottomTabBar from "@/components/BottomTabBar";
import {
  VipServiceCard,
  TransportCard,
  TourCard,
  EvoaCard,
  DestinationCard,
  ArticleCard,
  PromoCard,
} from "@/components/cards";
import {
  vipServices,
  transports,
  tours,
  evoaPlans,
  destinations,
  articles,
  promos,
  promoTabs,
  recommendationTabs,
  recommendationLinks,
  serviceSeoLinks,
} from "@/data/home";

export default function Home() {
  return (
    <div className="bg-white pb-20 md:pb-0">
      <Header />
      <HeroSearch />

      {/* Hero promo banner */}
      <div className="pt-8 md:pt-10">
        <BannerStrip
          title="Welcome to Booking VIP"
          subtitle="Airport VIP, private transport, curated tours & eVOA — all in one place."
          cta="Get started"
          tone="from-blue-700 via-indigo-700 to-blue-900"
        />
      </div>

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
        tabs={["Airport VIP", "Transport", "Tour Package", "eVOA"]}
        links={serviceSeoLinks}
      />

      <Footer />
      <BottomTabBar />
      {/* <StickyAppBanner /> */}
    </div>
  );
}
