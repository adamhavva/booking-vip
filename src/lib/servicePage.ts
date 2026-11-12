import { servicePages } from "@/data/services";
import type { ServiceLineDTO, ServicePage } from "@/types";

/**
 * Build the `ServicePage` shape of a service line from its database row.
 *
 * The static entry in `src/data/services.ts` stays the fallback (and the
 * source of the `catalog` kind, which decides which card renders the grid)
 * so a page keeps working when the database is unreachable.
 */
export function toServicePage(
  slug: string,
  line: ServiceLineDTO | null,
): ServicePage {
  const fallback = servicePages[slug];

  if (!line) return fallback;

  const sections = line.sections.map((s) => ({
    heading: s.heading.en,
    body: s.body.en,
  }));

  return {
    slug,
    eyebrow: line.short || fallback.eyebrow,
    title: line.label || fallback.title,
    intro: line.intro?.en || fallback.intro,
    sections: sections.length > 0 ? sections : fallback.sections,
    highlights:
      line.highlights.length > 0
        ? line.highlights.map((h) => h.en)
        : fallback.highlights,
    tabs: line.tabs.length > 0 ? line.tabs.map((t) => t.en) : fallback.tabs,
    catalog: fallback.catalog,
  };
}
