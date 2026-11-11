#!/usr/bin/env node --experimental-strip-types
// Seeds the content tables — promos, banners, articles, destinations, SEO
// links/blocks, search fields and settings — from the data that already
// exists in `src/data/*.ts`, the i18n dictionaries and the Indonesian copy
// in `src/data/content.id.ts`.
//
// Run through `npm run db:seed` (which calls this after the domain seed).
// Every write is an upsert keyed by a unique slug, so re-running is safe and
// keeps the database in sync with the source files.

import { db } from "../src/prisma/db.ts";
import {
  articles,
  destinations,
  footerColumns,
  promoTabs,
  promos,
  recommendationLinks,
  recommendationTabs,
  searchPlaceholders,
  serviceSeoLinks,
  serviceSeoTabs,
  seoBlocks,
  socials,
  utilityLinks,
} from "../src/data/home.ts";
import { serviceNav, servicePages, serviceSearchFields } from "../src/data/services.ts";
import {
  articleCopyId,
  destinationCopyId,
  promoCopyId,
  searchFieldCopyId,
  seoBlockCopyId,
  seoLinkCopyId,
  servicePageCopyId,
} from "../src/data/content.id.ts";
import { en } from "../src/i18n/en.ts";
import { id as idDict } from "../src/i18n/id.ts";

export type SeedCounts = Record<string, { created: number; existing: number }>;

function bump(counts: SeedCounts, table: string, created: boolean) {
  counts[table] ??= { created: 0, existing: 0 };
  if (created) counts[table].created++;
  else counts[table].existing++;
}

/** Both languages of a dictionary key. */
function copy(key: keyof typeof en): { en: string; id: string } {
  return { en: en[key], id: idDict[key] };
}

/** "VIP Welcome Offer" → "vip-welcome-offer" */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------------------------------------------------------------------------
// Promos
// ---------------------------------------------------------------------------
export async function seedPromos(counts: SeedCounts) {
  for (let i = 0; i < promos.length; i++) {
    const p = promos[i]!;
    const slug = slugify(p.title);
    const alt = promoCopyId[slug];

    const payload = {
      titleEn: p.title,
      titleId: alt?.title ?? null,
      subtitleEn: p.subtitle,
      subtitleId: alt?.subtitle ?? null,
      tone: p.tone,
      sortOrder: i,
      active: true,
    };

    const existing = await db.orm.public.Promo.select("id").where({ slug }).first();
    if (existing) {
      await db.orm.public.Promo.where({ id: existing.id }).update(payload);
      bump(counts, "Promo", false);
      continue;
    }
    await db.orm.public.Promo.create({ id: crypto.randomUUID(), slug, ...payload });
    bump(counts, "Promo", true);
  }
}

// ---------------------------------------------------------------------------
// Banners (copy comes from the i18n dictionary)
// ---------------------------------------------------------------------------
const bannerSpecs = [
  {
    slug: "fast-track",
    titleKey: "banner.fastTrackTitle",
    subtitleKey: "banner.fastTrackSubtitle",
    ctaKey: "banner.fastTrackCta",
    ctaHref: "/vip-service",
    tone: "from-sky-600 to-blue-800",
    sortOrder: 0,
  },
  {
    slug: "evoa-apply",
    titleKey: "banner.evoaTitle",
    subtitleKey: "banner.evoaSubtitle",
    ctaKey: "banner.evoaCta",
    ctaHref: "/evoa",
    tone: "from-violet-600 to-purple-800",
    sortOrder: 1,
  },
  {
    slug: "corporate",
    titleKey: "banner.corporateTitle",
    subtitleKey: "banner.corporateSubtitle",
    ctaKey: "banner.corporateCta",
    ctaHref: "/#corporate",
    tone: "from-slate-700 to-slate-900",
    sortOrder: 2,
  },
] as const;

export async function seedBanners(counts: SeedCounts) {
  for (const b of bannerSpecs) {
    const payload = {
      titleEn: en[b.titleKey],
      titleId: idDict[b.titleKey],
      subtitleEn: en[b.subtitleKey],
      subtitleId: idDict[b.subtitleKey],
      ctaEn: en[b.ctaKey],
      ctaId: idDict[b.ctaKey],
      ctaHref: b.ctaHref,
      placement: "home",
      tone: b.tone,
      sortOrder: b.sortOrder,
      active: true,
    };

    const existing = await db.orm.public.Banner.select("id").where({ slug: b.slug }).first();
    if (existing) {
      await db.orm.public.Banner.where({ id: existing.id }).update(payload);
      bump(counts, "Banner", false);
      continue;
    }
    await db.orm.public.Banner.create({ id: crypto.randomUUID(), slug: b.slug, ...payload });
    bump(counts, "Banner", true);
  }
}

// ---------------------------------------------------------------------------
// Articles + destinations
// ---------------------------------------------------------------------------
export async function seedArticles(counts: SeedCounts) {
  for (let i = 0; i < articles.length; i++) {
    const a = articles[i]!;
    const slug = slugify(a.title);
    const alt = articleCopyId[slug];

    const payload = {
      titleEn: a.title,
      titleId: alt?.title ?? null,
      categoryEn: a.category,
      categoryId: alt?.category ?? null,
      tone: a.tone,
      sortOrder: i,
      active: true,
    };

    const existing = await db.orm.public.Article.select("id").where({ slug }).first();
    if (existing) {
      await db.orm.public.Article.where({ id: existing.id }).update(payload);
      bump(counts, "Article", false);
      continue;
    }
    await db.orm.public.Article.create({ id: crypto.randomUUID(), slug, ...payload });
    bump(counts, "Article", true);
  }
}

export async function seedDestinations(counts: SeedCounts) {
  for (let i = 0; i < destinations.length; i++) {
    const d = destinations[i]!;
    const slug = slugify(d.name);
    const alt = destinationCopyId[slug];

    const payload = {
      nameEn: d.name,
      nameId: alt?.name ?? null,
      countryEn: d.country,
      countryId: alt?.country ?? null,
      tone: d.tone,
      sortOrder: i,
      active: true,
    };

    const existing = await db.orm.public.Destination.select("id").where({ slug }).first();
    if (existing) {
      await db.orm.public.Destination.where({ id: existing.id }).update(payload);
      bump(counts, "Destination", false);
      continue;
    }
    await db.orm.public.Destination.create({ id: crypto.randomUUID(), slug, ...payload });
    bump(counts, "Destination", true);
  }
}

// ---------------------------------------------------------------------------
// SEO links + blocks
// ---------------------------------------------------------------------------
export async function seedSeoLinks(counts: SeedCounts) {
  const rows = [
    ...recommendationLinks.map((l) => ({ ...l, group: "recommendations" })),
    ...serviceSeoLinks.map((l) => ({ ...l, group: "services" })),
  ];

  for (let i = 0; i < rows.length; i++) {
    const l = rows[i]!;
    const slug = slugify(l.label);

    const payload = {
      labelEn: l.label,
      labelId: seoLinkCopyId[slug] ?? null,
      href: `/?service=${encodeURIComponent(l.service)}`,
      service: l.service,
      group: l.group,
      tags: l.tags as unknown as [],
      sortOrder: i,
      active: true,
    };

    const existing = await db.orm.public.SeoLink.select("id").where({ slug }).first();
    if (existing) {
      await db.orm.public.SeoLink.where({ id: existing.id }).update(payload);
      bump(counts, "SeoLink", false);
      continue;
    }
    await db.orm.public.SeoLink.create({ id: crypto.randomUUID(), slug, ...payload });
    bump(counts, "SeoLink", true);
  }
}

export async function seedSeoBlocks(counts: SeedCounts) {
  for (let i = 0; i < seoBlocks.length; i++) {
    const b = seoBlocks[i]!;
    const slug = slugify(b.title);
    const alt = seoBlockCopyId[slug];

    const payload = {
      titleEn: b.title,
      titleId: alt?.title ?? null,
      sections: b.sections.map((s) => ({ heading: s.h, body: s.p })) as unknown as [],
      sectionsId: (alt?.sections ?? b.sections.map((s) => ({ heading: s.h, body: s.p }))) as unknown as [],
      sortOrder: i,
      active: true,
    };

    const existing = await db.orm.public.SeoBlock.select("id").where({ slug }).first();
    if (existing) {
      await db.orm.public.SeoBlock.where({ id: existing.id }).update(payload);
      bump(counts, "SeoBlock", false);
      continue;
    }
    await db.orm.public.SeoBlock.create({ id: crypto.randomUUID(), slug, ...payload });
    bump(counts, "SeoBlock", true);
  }
}

// ---------------------------------------------------------------------------
// Search fields (per service line)
// ---------------------------------------------------------------------------
export async function seedSearchFields(
  counts: SeedCounts,
  lineIds: Record<string, string>
) {
  for (const nav of serviceNav) {
    const slug = nav.href.replace(/^\//, "");
    const lineId = lineIds[slug];
    if (!lineId) continue;

    const fields = serviceSearchFields[nav.label] ?? [];
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i]!;
      const alt = searchFieldCopyId[`${slug}:${f.key}`];

      const payload = {
        labelEn: f.label,
        labelId: alt?.label ?? null,
        placeholderEn: f.placeholder ?? null,
        placeholderId: alt?.placeholder ?? null,
        icon: f.icon,
        kind: f.kind,
        sortOrder: i,
        active: true,
      };

      const existing = await db.orm.public.SearchField
        .select("id")
        .where({ lineId, key: f.key })
        .first();
      if (existing) {
        await db.orm.public.SearchField.where({ id: existing.id }).update(payload);
        bump(counts, "SearchField", false);
        continue;
      }
      await db.orm.public.SearchField.create({
        id: crypto.randomUUID(),
        lineId,
        key: f.key,
        ...payload,
      });
      bump(counts, "SearchField", true);
    }
  }
}

// ---------------------------------------------------------------------------
// Service line copy (intro, sections, highlights, tabs)
// ---------------------------------------------------------------------------
export async function seedServiceLineCopy(
  counts: SeedCounts,
  lineIds: Record<string, string>
) {
  for (const [slug, page] of Object.entries(servicePages)) {
    const lineId = lineIds[slug];
    if (!lineId) continue;

    const alt = servicePageCopyId[slug];

    const existing = await db.orm.public.ServiceLine.select("id").where({ id: lineId }).first();
    if (!existing) continue;

    await db.orm.public.ServiceLine
      .where({ id: lineId })
      .update({
        introEn: page.intro,
        introId: alt?.intro ?? null,
        sections: page.sections as unknown as [],
        sectionsId: (alt?.sections ?? page.sections) as unknown as [],
        highlights: page.highlights as unknown as [],
        highlightsId: (alt?.highlights ?? page.highlights) as unknown as [],
        tabs: page.tabs as unknown as [],
        tabsId: (alt?.tabs ?? page.tabs) as unknown as [],
      });
    bump(counts, "ServiceLine", false);
  }
}

// ---------------------------------------------------------------------------
// Settings — hero copy, footer, tabs, time slots, home section copy
// ---------------------------------------------------------------------------

/** The home page bands — eyebrow/title/see-all copy per section. */
const homeSections = [
  {
    key: "specialDeals",
    eyebrow: null,
    title: copy("home.specialDeals"),
    seeAll: null,
    seeAllHref: "",
    lineSlug: null,
  },
  {
    key: "vip",
    eyebrow: copy("home.vipEyebrow"),
    title: copy("home.vipTitle"),
    seeAll: copy("home.vipSeeAll"),
    seeAllHref: "/vip-service",
    lineSlug: "vip-service",
  },
  {
    key: "transport",
    eyebrow: copy("home.transportEyebrow"),
    title: copy("home.transportTitle"),
    seeAll: copy("home.transportSeeAll"),
    seeAllHref: "/transport",
    lineSlug: "transport",
  },
  {
    key: "tour",
    eyebrow: copy("home.tourEyebrow"),
    title: copy("home.tourTitle"),
    seeAll: copy("home.tourSeeAll"),
    seeAllHref: "/tour-package",
    lineSlug: "tour-package",
  },
  {
    key: "destinations",
    eyebrow: null,
    title: copy("home.destinationsTitle"),
    seeAll: copy("home.destinationsSeeAll"),
    seeAllHref: "",
    lineSlug: null,
  },
  {
    key: "evoa",
    eyebrow: copy("home.evoaEyebrow"),
    title: copy("home.evoaTitle"),
    seeAll: copy("home.evoaSeeAll"),
    seeAllHref: "/evoa",
    lineSlug: "evoa",
  },
  {
    key: "promos",
    eyebrow: null,
    title: copy("home.promosTitle"),
    seeAll: copy("home.promosSeeAll"),
    seeAllHref: "",
    lineSlug: null,
  },
  {
    key: "articles",
    eyebrow: null,
    title: copy("home.articlesTitle"),
    seeAll: null,
    seeAllHref: "",
    lineSlug: null,
  },
  {
    key: "recommendations",
    eyebrow: null,
    title: copy("home.recommendationsTitle"),
    seeAll: null,
    seeAllHref: "",
    lineSlug: null,
  },
  {
    key: "exploreServices",
    eyebrow: null,
    title: copy("home.exploreServicesTitle"),
    seeAll: null,
    seeAllHref: "",
    lineSlug: null,
  },
];

const settingValues: Record<string, unknown> = {
  "hero.copy": {
    en: {
      heading1: en["hero.heading1"],
      heading2: en["hero.heading2"],
      subtitle: en["hero.subtitle"],
      promo: en["hero.promo"],
      promoCta: en["hero.promoCta"],
    },
    id: {
      heading1: idDict["hero.heading1"],
      heading2: idDict["hero.heading2"],
      subtitle: idDict["hero.subtitle"],
      promo: idDict["hero.promo"],
      promoCta: idDict["hero.promoCta"],
    },
  },
  "footer.columns": { en: footerColumns, id: footerColumns },
  "footer.socials": { en: socials, id: socials },
  "utility.links": { en: utilityLinks, id: utilityLinks },
  "home.promoTabs": { en: promoTabs, id: promoTabs },
  "home.recommendationTabs": { en: recommendationTabs, id: recommendationTabs },
  "home.serviceSeoTabs": { en: serviceSeoTabs, id: serviceSeoTabs },
  "home.sections": homeSections,
  "search.timeSlots": [
    "06:00",
    "08:00",
    "10:00",
    "12:00",
    "14:00",
    "16:00",
    "18:00",
    "20:00",
    "22:00",
  ],
  "search.placeholders": { en: searchPlaceholders, id: searchPlaceholders },

  // Taxes — key → value. A value ending with "%" is a percentage of the
  // subtotal, a value starting with "$" is a fixed amount in USD.
  "pph12": "11%",
  "pph11": "9%",
  "service_fee": "$1",
};

export async function seedSettings(counts: SeedCounts) {
  for (const [key, value] of Object.entries(settingValues)) {
    const existing = await db.orm.public.Setting.select("key").where({ key }).first();
    if (existing) {
      await db.orm.public.Setting.where({ key }).update({ value: value as never });
      bump(counts, "Setting", false);
      continue;
    }
    await db.orm.public.Setting.create({
      key,
      value: value as never,
    });
    bump(counts, "Setting", true);
  }

  // Drop settings that are no longer managed by the seed — otherwise stale
  // keys linger in the database and confuse the read path.
  const managed = new Set(Object.keys(settingValues));
  const rows = await db.orm.public.Setting.select("key").all();
  for (const row of rows) {
    if (managed.has(row.key)) continue;
    await db.orm.public.Setting.where({ key: row.key }).delete();
    bump(counts, "Setting", false);
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
export async function seedContent(
  counts: SeedCounts,
  lineIds: Record<string, string>
) {
  await seedPromos(counts);
  await seedBanners(counts);
  await seedArticles(counts);
  await seedDestinations(counts);
  await seedSeoLinks(counts);
  await seedSeoBlocks(counts);
  await seedSearchFields(counts, lineIds);
  await seedServiceLineCopy(counts, lineIds);
  await seedSettings(counts);
}
