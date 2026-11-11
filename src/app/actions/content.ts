"use server";

import { db } from "@/prisma/db";
import { getCatalog } from "@/app/actions/catalog";
import type {
  ArticleDTO,
  BannerDTO,
  CopyDTO,
  CopySectionDTO,
  DestinationDTO,
  HomeContentDTO,
  HomeSectionDTO,
  PromoDTO,
  SearchFieldDTO,
  SeoBlockDTO,
  SeoLinkDTO,
  ServiceLineDTO,
  SettingsDTO,
} from "@/types";
import type { SearchFieldIcon, ServiceSearchFieldKind } from "@/types";

/**
 * Read path for the DB-driven content layer.
 *
 * Every function swallows its errors and returns an empty result, so the UI
 * can fall back to the static copy when the database is unreachable.
 */

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function copy(en: string | null | undefined, id: string | null | undefined): CopyDTO | null {
  if (!en) return null;
  return { en, id: id ?? null };
}

function plainCopy(en: string | null | undefined, id?: string | null): CopyDTO {
  return { en: en ?? "", id: id ?? null };
}

/** `[{ heading, body }]` → bilingual copy sections. */
function toSections(
  raw: unknown,
  rawId?: unknown
): CopySectionDTO[] {
  const en = Array.isArray(raw) ? raw : [];
  const id = Array.isArray(rawId) ? rawId : [];
  return en.flatMap((s, index) => {
    const item = s as { heading?: string; body?: string };
    if (!item.heading) return [];
    const alt = (id[index] ?? {}) as { heading?: string; body?: string };
    return [
      {
        heading: plainCopy(item.heading, alt.heading),
        body: plainCopy(item.body ?? "", alt.body),
      },
    ];
  });
}

/** `["…"]` → bilingual copy. */
function toCopies(raw: unknown, rawId?: unknown): CopyDTO[] {
  const en = Array.isArray(raw) ? raw : [];
  const id = Array.isArray(rawId) ? rawId : [];
  return en.flatMap((s, index) => {
    if (typeof s !== "string") return [];
    const alt = id[index];
    return [plainCopy(s, typeof alt === "string" ? alt : null)];
  });
}

function toStrings(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is string => typeof s === "string");
}

// ---------------------------------------------------------------------------
// Service lines
// ---------------------------------------------------------------------------
export async function getServiceLines(): Promise<ServiceLineDTO[]> {
  try {
    const rows = await db.orm.public.ServiceLine
      .select(
        "id",
        "slug",
        "label",
        "short",
        "badge",
        "tone",
        "imageUrl",
        "introEn",
        "introId",
        "sections",
        "sectionsId",
        "highlights",
        "highlightsId",
        "tabs",
        "tabsId"
      )
      .where((f) => f.active.eq(true))
      .orderBy((f) => f.sortOrder.asc())
      .all();

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      label: r.label,
      short: r.short,
      badge: r.badge ?? null,
      tone: r.tone,
      imageUrl: r.imageUrl ?? null,
      intro: copy(r.introEn, r.introId),
      sections: toSections(r.sections, r.sectionsId),
      highlights: toCopies(r.highlights, r.highlightsId),
      tabs: toCopies(r.tabs, r.tabsId),
    }));
  } catch (error) {
    console.error("[content] could not load service lines", error);
    return [];
  }
}

/** The copy of one service line (used by the service sub-pages). */
export async function getServiceLineContent(
  slug: string
): Promise<ServiceLineDTO | null> {
  const lines = await getServiceLines();
  return lines.find((l) => l.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// Search form fields
// ---------------------------------------------------------------------------
export async function getSearchFields(
  lineSlug: string
): Promise<SearchFieldDTO[]> {
  try {
    const line = await db.orm.public.ServiceLine
      .select("id")
      .where({ slug: lineSlug })
      .first();
    if (!line) return [];

    const rows = await db.orm.public.SearchField
      .select(
        "key",
        "labelEn",
        "labelId",
        "placeholderEn",
        "placeholderId",
        "icon",
        "kind"
      )
      .where({ lineId: line.id })
      .where((f) => f.active.eq(true))
      .orderBy((f) => f.sortOrder.asc())
      .all();

    return rows.map((r) => ({
      key: r.key,
      label: plainCopy(r.labelEn, r.labelId),
      placeholder: r.placeholderEn
        ? plainCopy(r.placeholderEn, r.placeholderId)
        : null,
      icon: r.icon as SearchFieldIcon,
      kind: r.kind as ServiceSearchFieldKind,
    }));
  } catch (error) {
    console.error("[content] could not load search fields", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export async function getSettings(): Promise<SettingsDTO> {
  try {
    const rows = await db.orm.public.Setting.select("key", "value").all();
    const out: SettingsDTO = {};
    for (const row of rows) out[row.key] = row.value;
    return out;
  } catch (error) {
    console.error("[content] could not load settings", error);
    return {};
  }
}

/** The quick time slots offered by the date & time picker. */
export async function getTimeSlots(): Promise<string[]> {
  const settings = await getSettings();
  return toStrings(settings["search.timeSlots"]);
}

/** The bands of the home page (eyebrow / title / see-all copy). */
export async function getHomeSections(): Promise<HomeSectionDTO[]> {
  const settings = await getSettings();
  const raw = settings["home.sections"];
  const list = Array.isArray(raw) ? raw : [];
  return list.flatMap((s) => {
    const item = s as {
      key?: string;
      eyebrow?: CopyDTO | null;
      title?: CopyDTO;
      seeAll?: CopyDTO | null;
      seeAllHref?: string;
      lineSlug?: string | null;
    };
    if (!item.key || !item.title) return [];
    return [
      {
        key: item.key,
        eyebrow: item.eyebrow ?? null,
        title: item.title,
        seeAll: item.seeAll ?? null,
        seeAllHref: item.seeAllHref ?? "",
        lineSlug: item.lineSlug ?? null,
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// Home content
// ---------------------------------------------------------------------------
export async function getHomeContent(): Promise<HomeContentDTO | null> {
  try {
    const [
      lines,
      promos,
      banners,
      articles,
      destinations,
      seoLinks,
      seoBlocks,
      settings,
    ] = await Promise.all([
      getServiceLines(),
      db.orm.public.Promo
        .select(
          "slug",
          "titleEn",
          "titleId",
          "subtitleEn",
          "subtitleId",
          "imageUrl",
          "tone"
        )
        .where((f) => f.active.eq(true))
        .orderBy((f) => f.sortOrder.asc())
        .all(),
      db.orm.public.Banner
        .select(
          "slug",
          "titleEn",
          "titleId",
          "subtitleEn",
          "subtitleId",
          "ctaEn",
          "ctaId",
          "ctaHref",
          "imageUrl",
          "tone"
        )
        .where((f) => f.active.eq(true))
        .orderBy((f) => f.sortOrder.asc())
        .all(),
      db.orm.public.Article
        .select(
          "slug",
          "titleEn",
          "titleId",
          "categoryEn",
          "categoryId",
          "excerptEn",
          "excerptId",
          "imageUrl",
          "tone"
        )
        .where((f) => f.active.eq(true))
        .orderBy((f) => f.sortOrder.asc())
        .all(),
      db.orm.public.Destination
        .select(
          "slug",
          "nameEn",
          "nameId",
          "countryEn",
          "countryId",
          "imageUrl",
          "tone"
        )
        .where((f) => f.active.eq(true))
        .orderBy((f) => f.sortOrder.asc())
        .all(),
      db.orm.public.SeoLink
        .select("slug", "labelEn", "labelId", "href", "service", "group", "tags")
        .where((f) => f.active.eq(true))
        .orderBy((f) => f.sortOrder.asc())
        .all(),
      db.orm.public.SeoBlock
        .select("slug", "titleEn", "titleId", "sections", "sectionsId")
        .where((f) => f.active.eq(true))
        .orderBy((f) => f.sortOrder.asc())
        .all(),
      getSettings(),
    ]);

    // The home carousels show the products of each line.
    const catalogs: HomeContentDTO["catalogs"] = {};
    for (const line of lines) {
      const catalog = await getCatalog(line.slug);
      if (catalog) catalogs[line.slug] = catalog;
    }

    return {
      lines,
      promos: promos.map(
        (p): PromoDTO => ({
          slug: p.slug,
          title: plainCopy(p.titleEn, p.titleId),
          subtitle: copy(p.subtitleEn, p.subtitleId),
          imageUrl: p.imageUrl ?? null,
          tone: p.tone,
        })
      ),
      banners: banners.map(
        (b): BannerDTO => ({
          slug: b.slug,
          title: plainCopy(b.titleEn, b.titleId),
          subtitle: copy(b.subtitleEn, b.subtitleId),
          cta: copy(b.ctaEn, b.ctaId),
          ctaHref: b.ctaHref ?? null,
          imageUrl: b.imageUrl ?? null,
          tone: b.tone,
        })
      ),
      articles: articles.map(
        (a): ArticleDTO => ({
          slug: a.slug,
          title: plainCopy(a.titleEn, a.titleId),
          category: copy(a.categoryEn, a.categoryId),
          excerpt: copy(a.excerptEn, a.excerptId),
          imageUrl: a.imageUrl ?? null,
          tone: a.tone,
        })
      ),
      destinations: destinations.map(
        (d): DestinationDTO => ({
          slug: d.slug,
          name: plainCopy(d.nameEn, d.nameId),
          country: copy(d.countryEn, d.countryId),
          imageUrl: d.imageUrl ?? null,
          tone: d.tone,
        })
      ),
      seoLinks: seoLinks.map(
        (l): SeoLinkDTO => ({
          slug: l.slug,
          label: plainCopy(l.labelEn, l.labelId),
          href: l.href,
          service: l.service ?? null,
          group: l.group,
          tags: toStrings(l.tags),
        })
      ),
      seoBlocks: seoBlocks.map(
        (b): SeoBlockDTO => ({
          slug: b.slug,
          title: plainCopy(b.titleEn, b.titleId),
          sections: toSections(b.sections, b.sectionsId),
        })
      ),
      settings,
      catalogs,
    };
  } catch (error) {
    console.error("[content] could not load home content", error);
    return null;
  }
}
