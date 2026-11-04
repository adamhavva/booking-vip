# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is npm (`package-lock.json`). There is **no lint or test tooling configured** — do not assume `npm run lint` / `npm test` exist.

```bash
npm run dev     # next dev (Turbopack)
npm run build   # next build — also type-checks
npm run start   # next start
npx tsc --noEmit  # faster standalone type-check

# Prisma 8 (Supabase Postgres) — see "Database" section below
npx prisma contract emit    # recompile schema → src/prisma/contract.{json,d.ts} (alias: npm run contract:emit)
npx prisma migration check  # offline contract/migration validation
npx prisma contract print   # show the compiled contract as PSL
```

## Database — Prisma ORM 8 + Supabase

Connection strings live in `.env` (gitignored): `DATABASE_URL` = Supabase transaction-mode pooler (port 6543, `?pgbouncer=true`) for the runtime client; `DIRECT_URL` = session-mode pooler (port 5432) for CLI-side operations, wired through `prisma.config.ts`. The Supabase project is live and the password in `.env` is filled in — the CLI and the app both reach the real database.

Prisma 8 rearchitected the CLI: there is no `prisma validate` / `prisma generate`. The contract source is the Prisma-7-style `prisma/schema.prisma`, consumed via `prisma7Schema()` in `prisma.config.ts`; `npx prisma contract emit` compiles it to `src/prisma/contract.json` + `contract.d.ts` (both committed). The runtime client is `src/prisma/db.ts` — import `db` from there, do not instantiate your own client. Supabase agent skills are installed under `.claude/skills/` and pinned in `skills-lock.json`.

**Current model:** `SearchLog` (append-only history of submitted searches: `service`, `href`, `values` jsonb, `createdAt`). Migrations live in `migrations/app/` and are committed. The Prisma 8 loop for a schema change is:

```bash
npx prisma contract emit          # schema → contract.json + contract.d.ts
npx prisma migration plan --name <slug>   # write the migration package (offline)
npx prisma db migrate             # apply it to the live database
npx prisma db sign                # record that the DB matches the contract
```

**App usage:** queries go through `db.orm.public.<Model>` (e.g. `db.orm.public.SearchLog.create({...})`, `.select(...).orderBy(...).limit(n).all()`; filtered writes like `.where(...).deleteAll()`). Server Actions in `src/app/actions/search.ts` (`logSearch`, `getRecentSearches`) wrap the DB for the UI and swallow errors, so the UI keeps working from the localStorage copy when the database is unreachable. `logSearch` dedupes identical submissions (same service + href + values refreshes `createdAt` instead of inserting) and prunes rows older than 30 days (`RETENTION_DAYS`) on every insert. Never read the database during render of a statically prerendered page — the pages stay static and fetch from the client.

## This is Next.js 16 — not the version in your training data

`AGENTS.md` is auto-generated and re-added by `next dev` (see `node_modules/next/dist/server/lib/generate-agent-files.js`). Do not delete that block; commit it alongside your changes. Before writing Next-specific code, read the relevant guide under `node_modules/next/dist/docs/` — APIs and conventions may differ from memory. Notable config in `next.config.ts`:

- `cacheComponents: true`, `partialPrefetching: true`, `reactCompiler: true`
- Tailwind CSS v4 is wired through `@tailwindcss/turbopack` as a Turbopack loader rule for `*.css` — there is no `postcss.config` or `tailwind.config`.
- Route prop types are generated: `layout.tsx` uses the global `LayoutProps<"/">` (see `.next/types`), not a hand-written props interface.

## Architecture

Single-page marketing/concierge UI (Booking VIP, a tiket.com-style educational clone). Next.js App Router, React 19, TypeScript strict, Tailwind v4. No backend, API routes, database, or auth — all content is hard-coded placeholder data.

**Composition:** `src/app/page.tsx` (server component) assembles the whole home page. `StickyAppBanner` is intentionally left commented out in `page.tsx` — don't "fix" that by re-enabling it unless asked.

**Routes:** `/` (home) plus four service sub-pages — `/vip-service`, `/transport`, `/tour-package`, `/evoa` — and `/search?q=…`. Each sub-page is a thin wrapper around `src/components/sections/ServiceLayout.tsx` (header + navbar, hero band, copy, `BookingPanel`, `ServiceCatalog`, footer, bottom tab bar) fed by `src/data/services.ts`. New service menus: add an entry to `serviceNav` + `servicePages` in `src/data/services.ts` and create the matching `src/app/<slug>/page.tsx`.

**Navigation:** `src/components/layout/NavBar.tsx` is the primary navbar — a working search form (submits to `/search?q=…`, index built in `src/data/search.ts`), the four service links (`serviceNav`) with `usePathname()` active state, and a mobile drawer behind a hamburger button. It is rendered inside `Header`, which is a client component with two variants: `overlay` (transparent over the home hero, becomes fixed + white after 80px of scroll) and `solid` (sticky white bar, used on the sub-pages). Both variants keep the navbar on every page.

**Search flow:** the home hero form (`HeroSearch`) selects a service with the category rail and fills real inputs; pressing **Search** navigates to that service page with the entered values in the query string (`/transport?pickup=…&pax=…&service=Transport`). Field keys per service live in `serviceSearchFields` (`src/data/services.ts`). The submitted search is stored twice: in the database (Server Action `logSearch` → `SearchLog` table, cross-device) and on the device (`src/lib/searchDraft.ts` localStorage — last search + five recent). The home form pre-fills from the local copy, the "Pencarian terakhir" section (`RecentSearches`) reads the database with a localStorage fallback, and the sub-page falls back to the local copy when the URL carries no values.

**Folder layout:**

- `src/components/ui/` — shared primitives: `Container` (page gutter/max-width), `TabPills`, `Badge`, `PriceBlock`, `Rating`, `Thumb`, `SectionHeading`, `Carousel`.
- `src/components/cards/` — one file per card type (`VipServiceCard`, `TourCard`, …) plus a barrel `index.ts`. Card components are composable from `ui/` primitives; the shared shell lives in `src/lib/styles.ts`.
- `src/components/sections/` — page-level sections (`HeroSearch`, `SectionBand`, `SeoLinkGrid`, `Footer`, `ServiceLayout`, `ServiceCatalog`, `ServiceSearchSection`, `BookingPanel`, `SearchResults`, …).
- `src/components/layout/` — `Header`, `NavBar`, and `Logo`.
- `src/lib/` — `format.ts` (currency), `styles.ts` (card shell), `searchDraft.ts` (client-side search persistence).
- `src/types/` — all shared data types, exported from `src/types/index.ts`.
- `src/components/icons.tsx` — the single icon module.

**Data flow:** every piece of copy, price, card, tab list, footer link, and SEO link lives in `src/data/home.ts`; service menus and sub-page copy live in `src/data/services.ts`; the search index in `src/data/search.ts`. Components receive typed props (`VipService`, `Transport`, `Tour`, `EvoaPlan`, `ServicePage`, ...) imported from `@/types`. To change content, edit the data files, not the components. Data is dummy/placeholder by design.

**Rendering boundary:** interactive widgets are `"use client"` — `Header`, `NavBar`, `HeroSearch`, `SectionBand`, `SeoLinkGrid`, `TabPills`, `Carousel`, `ServiceCatalog`, `BookingPanel`, `SearchResults`, `BottomTabBar`, `StickyAppBanner`. Everything else (`Footer`, `SeoContent`, `BannerStrip`, `Logo`, `Container`, `SectionHeading`, `ServiceLayout`, all `cards/*`, `icons.tsx`) is a server component. Keep this split: do not add client directives to presentational components.

**Cards:** `src/components/cards/` maps each data type to a card component using shared `Badge`, `PriceBlock`, `Rating`, and `Thumb` primitives. Images are intentional gradient placeholders: each data record carries a Tailwind `tone` string (e.g. `"from-sky-400 to-blue-600"`) rendered through `Thumb`, not real image assets. The SVGs in `public/` are unused create-next-app leftovers.

**Styling system:** design tokens are declared in `src/app/globals.css` under `@theme inline` (e.g. `--color-brand`, `--color-ink`, `--color-muted`, `--color-line`, `--color-canvas`, `--color-brand-soft`, `--color-danger`). Use the semantic utilities (`bg-brand`, `text-ink`, `border-line`, `bg-canvas`) rather than raw hex values. Font is Figtree via `next/font/google`, exposed as `--font-figtree` and mapped to `--font-sans`.

**Icons:** hand-rolled inline SVGs in `src/components/icons.tsx` driven by a `base()` prop helper (24×24, currentColor, 2px stroke). Add new icons there instead of importing an icon library.

**Conventions:** `@/*` aliases `src/*` (see `tsconfig.json`). Currency is formatted with `usd()` from `src/lib/format.ts` (all prices in `src/data/home.ts` are USD integers). Layout is mobile-first — fixed `BottomTabBar` (safe-area padded) on mobile, absolute-over-hero `Header` on desktop, and every section wraps content in `<Container>` (`mx-auto max-w-[1200px] px-4 sm:px-6`). The root layout sets `viewportFit: "cover"` so the bottom bar respects device safe areas.