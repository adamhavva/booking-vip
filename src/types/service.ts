export type ServiceNavItem = {
  label: string;
  href: string;
  short: string;
  tone: string;
};

export type ServicePageSection = {
  heading: string;
  body: string;
};

/** Which card component renders the catalog of a service page. */
export type ServiceCatalogKind = "vip" | "transport" | "tour" | "evoa";

/** Icon slot used by the search form fields. */
export type SearchFieldIcon = "plane" | "pin" | "cal" | "users" | "star";

export type ServiceSearchField = {
  /** Query-string key, also the key of the persisted draft value. */
  key: string;
  label: string;
  defaultValue: string;
  icon: SearchFieldIcon;
};

export type ServicePage = {
  slug: string;
  eyebrow: string;
  title: string;
  intro: string;
  sections: ServicePageSection[];
  highlights: string[];
  /** Filter tabs above the catalog grid. */
  tabs: string[];
  /** Catalog rendered below the intro, reusing the home cards. */
  catalog: ServiceCatalogKind;
};

export type SearchResult = {
  kind: string;
  title: string;
  subtitle: string;
  href: string;
  tone: string;
};

/** A search the user submitted — persisted in localStorage. */
export type SearchDraft = {
  service: string;
  href: string;
  values: Record<string, string>;
  savedAt: number;
};
