# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is npm (`package-lock.json`). There is **no lint or test tooling configured** — do not assume `npm run lint` / `npm test` exist.

```bash
npm run dev     # next dev (Turbopack)
npm run build   # next build — also type-checks
npm run start   # next start
npx tsc --noEmit  # faster standalone type-check
```

## This is Next.js 16 — not the version in your training data

`AGENTS.md` is auto-generated and re-added by `next dev` (see `node_modules/next/dist/server/lib/generate-agent-files.js`). Do not delete that block; commit it alongside your changes. Before writing Next-specific code, read the relevant guide under `node_modules/next/dist/docs/` — APIs and conventions may differ from memory. Notable config in `next.config.ts`:

- `cacheComponents: true`, `partialPrefetching: true`, `reactCompiler: true`
- Tailwind CSS v4 is wired through `@tailwindcss/turbopack` as a Turbopack loader rule for `*.css` — there is no `postcss.config` or `tailwind.config`.
- Route prop types are generated: `layout.tsx` uses the global `LayoutProps<"/">` (see `.next/types`), not a hand-written props interface.

## Architecture

Single-page marketing/concierge UI (Booking VIP, a tiket.com-style educational clone). Next.js App Router, React 19, TypeScript strict, Tailwind v4. No backend, API routes, database, or auth — all content is hard-coded placeholder data.

**Composition:** `src/app/page.tsx` (server component) assembles the whole page. There is only one route; new sections are added there rather than as new pages. `StickyAppBanner` is intentionally left commented out in `page.tsx` — don't "fix" that by re-enabling it unless asked.

**Folder layout:**

- `src/components/ui/` — shared primitives: `Container` (page gutter/max-width), `TabPills`, `Badge`, `PriceBlock`, `Rating`, `Thumb`, `SectionHeading`, `Carousel`.
- `src/components/cards/` — one file per card type (`VipServiceCard`, `TourCard`, …) plus a barrel `index.ts`. Card components are composable from `ui/` primitives; the shared shell lives in `src/lib/styles.ts`.
- `src/components/sections/` — page-level sections (`HeroSearch`, `SectionBand`, `SeoLinkGrid`, `Footer`, …).
- `src/components/layout/` — `Header` and `Logo`.
- `src/types/` — all shared data types, exported from `src/types/index.ts`.
- `src/components/icons.tsx` — the single icon module.

**Data flow:** every piece of copy, price, card, tab list, footer link, and SEO link lives in `src/data/home.ts`. Components receive typed props (`VipService`, `Transport`, `Tour`, `EvoaPlan`, ...) imported from `@/types`. To change content, edit `home.ts`, not the components. Data is dummy/placeholder by design.

**Rendering boundary:** interactive widgets are `"use client"` — `Header`, `HeroSearch`, `SectionBand`, `SeoLinkGrid`, `TabPills`, `Carousel`, `BottomTabBar`, `StickyAppBanner`. Everything else (`Footer`, `SeoContent`, `BannerStrip`, `Logo`, `Container`, `SectionHeading`, all `cards/*`, `icons.tsx`) is a server component. Keep this split: do not add client directives to presentational components.

**Cards:** `src/components/cards/` maps each data type to a card component using shared `Badge`, `PriceBlock`, `Rating`, and `Thumb` primitives. Images are intentional gradient placeholders: each data record carries a Tailwind `tone` string (e.g. `"from-sky-400 to-blue-600"`) rendered through `Thumb`, not real image assets. The SVGs in `public/` are unused create-next-app leftovers.

**Styling system:** design tokens are declared in `src/app/globals.css` under `@theme inline` (e.g. `--color-brand`, `--color-ink`, `--color-muted`, `--color-line`, `--color-canvas`, `--color-brand-soft`, `--color-danger`). Use the semantic utilities (`bg-brand`, `text-ink`, `border-line`, `bg-canvas`) rather than raw hex values. Font is Figtree via `next/font/google`, exposed as `--font-figtree` and mapped to `--font-sans`.

**Icons:** hand-rolled inline SVGs in `src/components/icons.tsx` driven by a `base()` prop helper (24×24, currentColor, 2px stroke). Add new icons there instead of importing an icon library.

**Conventions:** `@/*` aliases `src/*` (see `tsconfig.json`). Currency is formatted with `usd()` from `src/lib/format.ts` (all prices in `src/data/home.ts` are USD integers). Layout is mobile-first — fixed `BottomTabBar` (safe-area padded) on mobile, absolute-over-hero `Header` on desktop, and every section wraps content in `<Container>` (`mx-auto max-w-[1200px] px-4 sm:px-6`). The root layout sets `viewportFit: "cover"` so the bottom bar respects device safe areas.