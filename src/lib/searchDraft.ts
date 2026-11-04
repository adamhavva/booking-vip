// Client-side persistence for the search form.
//
// The submitted search is kept in localStorage so the service pages can
// restore it (and the home form can pre-fill itself) on the next visit.
// Swap these helpers for API calls when the database layer is ready.

import type { SearchDraft } from "@/types";

const DRAFT_KEY = "booking-vip:last-search";
const RECENT_KEY = "booking-vip:recent-searches";
const MAX_RECENT = 5;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode / quota) — ignore.
  }
}

/** The last search the user submitted on this device. */
export function loadDraft(): SearchDraft | null {
  return read<SearchDraft>(DRAFT_KEY);
}

export function saveDraft(draft: SearchDraft) {
  write(DRAFT_KEY, draft);
}

/** Up to five previously submitted searches, newest first. */
export function loadRecent(): SearchDraft[] {
  return read<SearchDraft[]>(RECENT_KEY) ?? [];
}

/** Store a search as the last one, and push it onto the recent list. */
export function rememberSearch(draft: SearchDraft) {
  saveDraft(draft);
  const key = Object.entries(draft.values)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const recent = loadRecent().filter(
    (d) => !(d.service === draft.service && d.href === draft.href && key === Object.entries(d.values).map(([k, v]) => `${k}=${v}`).join("&"))
  );
  write(RECENT_KEY, [draft, ...recent].slice(0, MAX_RECENT));
}

export function clearSearches() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
    window.localStorage.removeItem(RECENT_KEY);
  } catch {
    // ignore
  }
}
