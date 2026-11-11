"use client";

// Client-side read path for the DB-driven content layer.
//
// The pages are statically prerendered, so the database is read from the
// browser after hydration. Every hook falls back to the static copy that
// ships with the app when the database is unreachable or empty — the site
// keeps working offline.

import { useEffect, useState } from "react";
import {
  getHomeContent,
  getSearchFields,
  getServiceLineContent,
  getServiceLines,
  getTimeSlots,
} from "@/app/actions/content";
import type {
  HomeContentDTO,
  SearchFieldDTO,
  ServiceLineDTO,
} from "@/types";
import { servicePages, serviceSearchFields } from "@/data/services";
import { serviceNav } from "@/data/services";

/**
 * The static fallback for a service line — the copy that ships with the app.
 */
export function staticServiceLine(slug: string): ServiceLineDTO | null {
  const page = servicePages[slug];
  if (!page) return null;
  const nav = serviceNav.find((s) => s.href === `/${slug}`);
  return {
    id: `static:${slug}`,
    slug,
    label: nav?.label ?? page.eyebrow,
    short: nav?.short ?? page.eyebrow.slice(0, 3),
    badge: null,
    tone: nav?.tone ?? "from-sky-400 to-blue-600",
    imageUrl: null,
    intro: { en: page.intro, id: null },
    sections: page.sections.map((s) => ({
      heading: { en: s.heading, id: null },
      body: { en: s.body, id: null },
    })),
    highlights: page.highlights.map((h) => ({ en: h, id: null })),
    tabs: page.tabs.map((t) => ({ en: t, id: null })),
  };
}

/**
 * The search fields of a service line — from the database when possible,
 * otherwise from the static copy.
 */
export function staticSearchFields(lineSlug: string): SearchFieldDTO[] {
  const nav = serviceNav.find((s) => s.href === `/${lineSlug}`);
  if (!nav) return [];
  const fields = serviceSearchFields[nav.label] ?? [];
  return fields.map((f) => ({
    key: f.key,
    label: { en: f.label, id: null },
    placeholder: f.placeholder ? { en: f.placeholder, id: null } : null,
    icon: f.icon,
    kind: f.kind,
  }));
}

/**
 * The content of one service line.
 *
 * Returns the static copy right away and swaps in the database copy once it
 * arrives — so the page is never empty while the database loads.
 */
export function useServiceLine(slug: string): ServiceLineDTO {
  const fallback = staticServiceLine(slug);
  const [line, setLine] = useState<ServiceLineDTO | null>(fallback);

  useEffect(() => {
    let active = true;
    getServiceLineContent(slug).then((db) => {
      if (active && db) setLine(db);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  return line ?? fallback ?? emptyLine(slug);
}

function emptyLine(slug: string): ServiceLineDTO {
  return {
    id: `static:${slug}`,
    slug,
    label: slug,
    short: slug.slice(0, 3).toUpperCase(),
    badge: null,
    tone: "from-sky-400 to-blue-600",
    imageUrl: null,
    intro: null,
    sections: [],
    highlights: [],
    tabs: [],
  };
}

/**
 * The search fields of a service line.
 */
export function useSearchFields(lineSlug: string): SearchFieldDTO[] {
  const fallback = staticSearchFields(lineSlug);
  const [fields, setFields] = useState<SearchFieldDTO[]>(fallback);

  useEffect(() => {
    let active = true;
    if (!lineSlug) return;
    getSearchFields(lineSlug).then((db) => {
      if (active && db.length > 0) setFields(db);
    });
    return () => {
      active = false;
    };
  }, [lineSlug]);

  return fields;
}

/**
 * The quick time slots of the date & time picker.
 */
export function useTimeSlots(): string[] {
  const [slots, setSlots] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    getTimeSlots().then((db) => {
      if (active && db.length > 0) setSlots(db);
    });
    return () => {
      active = false;
    };
  }, []);

  return slots;
}

/**
 * The service lines (the tabs of the hero form) — from the database when
 * possible, otherwise from the static copy.
 */
export function useServiceLines(): ServiceLineDTO[] {
  const fallback = serviceNav.map((nav) => staticServiceLine(nav.href.replace(/^\//, ""))!)
    .filter((l): l is ServiceLineDTO => l !== null);
  const [lines, setLines] = useState<ServiceLineDTO[]>(fallback);

  useEffect(() => {
    let active = true;
    getServiceLines().then((db) => {
      if (active && db.length > 0) setLines(db);
    });
    return () => {
      active = false;
    };
  }, []);

  return lines;
}

/**
 * The whole home-page content: promos, banners, articles, destinations,
 * SEO blocks/links, the service lines and their catalogs.
 */
export function useHomeContent(): HomeContentDTO | null {
  const [content, setContent] = useState<HomeContentDTO | null>(null);

  useEffect(() => {
    let active = true;
    getHomeContent().then((db) => {
      if (active && db) setContent(db);
    });
    return () => {
      active = false;
    };
  }, []);

  return content;
}
