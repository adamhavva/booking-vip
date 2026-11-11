// DTO types for the DB-driven content layer (promos, banners, articles,
// destinations, SEO blocks, service lines, search fields …).
//
// Every piece of copy carries both languages so the client can pick one at
// render time without another round trip.

import type { CatalogDTO } from "./catalog";
import type { SearchFieldIcon, ServiceSearchFieldKind } from "./service";

/** A piece of copy in both languages. `id` may be null — English is used then. */
export type CopyDTO = {
  en: string;
  id: string | null;
};

/** A heading + body pair, in both languages. */
export type CopySectionDTO = {
  heading: CopyDTO;
  body: CopyDTO;
};

export type ServiceLineDTO = {
  id: string;
  slug: string;
  label: string;
  short: string;
  badge: string | null;
  tone: string;
  imageUrl: string | null;
  intro: CopyDTO | null;
  sections: CopySectionDTO[];
  highlights: CopyDTO[];
  tabs: CopyDTO[];
};

export type SearchFieldDTO = {
  key: string;
  label: CopyDTO;
  placeholder: CopyDTO | null;
  icon: SearchFieldIcon;
  kind: ServiceSearchFieldKind;
};

export type PromoDTO = {
  slug: string;
  title: CopyDTO;
  subtitle: CopyDTO | null;
  imageUrl: string | null;
  tone: string;
};

export type BannerDTO = {
  slug: string;
  title: CopyDTO;
  subtitle: CopyDTO | null;
  cta: CopyDTO | null;
  ctaHref: string | null;
  imageUrl: string | null;
  tone: string;
};

export type ArticleDTO = {
  slug: string;
  title: CopyDTO;
  category: CopyDTO | null;
  excerpt: CopyDTO | null;
  imageUrl: string | null;
  tone: string;
};

export type DestinationDTO = {
  slug: string;
  name: CopyDTO;
  country: CopyDTO | null;
  imageUrl: string | null;
  tone: string;
};

/** A band of the home page — its copy and what it links to. */
export type HomeSectionDTO = {
  key: string;
  eyebrow: CopyDTO | null;
  title: CopyDTO;
  seeAll: CopyDTO | null;
  seeAllHref: string;
  lineSlug: string | null;
};

export type SeoLinkDTO = {
  slug: string;
  label: CopyDTO;
  href: string;
  service: string | null;
  group: string;
  tags: string[];
};

export type SeoBlockDTO = {
  slug: string;
  title: CopyDTO;
  sections: CopySectionDTO[];
};

/** Every setting row, keyed by name. */
export type SettingsDTO = Record<string, unknown>;

export type HomeContentDTO = {
  lines: ServiceLineDTO[];
  promos: PromoDTO[];
  banners: BannerDTO[];
  articles: ArticleDTO[];
  destinations: DestinationDTO[];
  seoLinks: SeoLinkDTO[];
  seoBlocks: SeoBlockDTO[];
  settings: SettingsDTO;
  /** Catalog per service line slug — powers the home carousels. */
  catalogs: Record<string, CatalogDTO>;
};
