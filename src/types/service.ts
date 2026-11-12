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

/** Field kind — determines how the field renders. */
export type ServiceSearchFieldKind =
  | "text"
  | "date"
  /** Date + time (the time is stored under `<key>Time`). */
  | "datetime"
  /** Passenger counter (adults / children / infants). */
  | "pax"
  | "select-airport"
  /** Country of the airports we serve — narrows the airport dropdown. */
  | "select-place-country"
  | "select-city"
  | "select-service-type"
  | "select-country";

export type ServiceSearchField = {
  /** Query-string key, also the key of the persisted draft value. */
  key: string;
  label: string;
  /** Shown while nothing is selected yet. */
  placeholder?: string;
  icon: SearchFieldIcon;
  /** Field kind — determines how the field renders. */
  kind: ServiceSearchFieldKind;
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
  priceUsd?: number;
};

/** A search the user submitted — persisted in localStorage. */
export type SearchDraft = {
  service: string;
  href: string;
  values: Record<string, string>;
  savedAt: number;
};
