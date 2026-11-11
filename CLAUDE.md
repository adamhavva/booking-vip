# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is npm (`package-lock.json`). There is **no lint or test tooling configured** — do not assume `npm run lint` / `npm test` exist.

```bash
npm run dev     # next dev (Turbopack)
npm run build   # next build — also type-checks
npm run start   # next start
npx tsc --noEmit  # faster standalone type-check
npm run db:seed # idempotent seeder (scripts/seed.mts) — inserts only missing rows

# Prisma 8 (Supabase Postgres) — see "Database" section below
npx prisma contract emit    # recompile schema → src/prisma/contract.{json,d.ts} (alias: npm run contract:emit)
npx prisma migration check  # offline contract/migration validation
npx prisma contract print   # show the compiled contract as PSL
```

## Database — Prisma ORM 8 + Supabase

Connection strings live in `.env` (gitignored): `DATABASE_URL` = Supabase transaction-mode pooler (port 6543, `?pgbouncer=true`) for the runtime client; `DIRECT_URL` = session-mode pooler (port 5432) for CLI-side operations, wired through `prisma.config.ts`. The Supabase project is live and the password in `.env` is filled in — the CLI and the app both reach the real database.

Prisma 8 rearchitected the CLI: there is no `prisma validate` / `prisma generate`. The contract source is the Prisma-7-style `prisma/schema.prisma`, consumed via `prisma7Schema()` in `prisma.config.ts`; `npx prisma contract emit` compiles it to `src/prisma/contract.json` + `contract.d.ts` (both committed). The runtime client is `src/prisma/db.ts` — import `db` from there, do not instantiate your own client. Supabase agent skills are installed under `.claude/skills/` and pinned in `skills-lock.json`.

**Models** (migrations in `migrations/app/`, committed):

- *Search* — `SearchLog` (append-only: `service`, `href`, `values` jsonb, `createdAt`).
- *Catalog* — `ServiceLine` → `ServiceType`, `Product`, `ProductPackage`, `PriceTier`, `Amenity` / `ProductAmenity`, `ProductAddOn`. `Airport` is the shared place reference (kind `airport` | `city`, `iataCode` unique when set). Product JSON columns (`included`, `notIncluded`, `requirements`) are string arrays. Dynamic-option fields are the ⚙ ones the BookingBox renders as select fields — their option lists come from `getOptions(kind)` actions: `Airport` (for `airport`/`city`), `ServiceType`, `Airline`, `Country`.
- *Booking* — `Booking` (header; `code` unique `BV-…`, `status` ∈ `awaiting_payment`|`confirmed`|`cancelled`|`completed`, `serviceAt`, pax counts, integer USD-cent totals with a snapshot of `currencyCode` + `fxRate` at booking time), `BookingItem` (per package line), `BookingAddOn`, `Contact` (1:1), `Traveler*`, `FlightDetails` (1:1), `Payment*`, `PaymentMethod`.
- *Accounts* — `User` (id = the Firebase UID, `email` unique, `name`, `phone`, `role` ∈ `ADMIN`|`USER` (default `USER`), `emailVerified`, timestamps). `Booking.userId` points at it (nullable — guest bookings stay `null`, FK `ON DELETE SET NULL` / `ON UPDATE CASCADE`). The **role column is the source of truth** for the admin/user split.
- *Currency / FX* — `Currency` (code, symbol, decimals, locale), `ExchangeRate` (per-date `ratePerUsd`). Runtime UI rates come from the public Frankfurter API, cached in `localStorage`; the DB tables are reserved for admin overrides.

All money values are **integer USD cents** on the wire and in the DB. Booking snapshot fields (`currencyCode`, `fxRate`, `totalUsdCents`) are immutable once created — they record the quote the customer saw.

The Prisma 8 loop for a schema change is:

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

Marketing + booking concierge site (Booking VIP, a tiket.com-style educational clone). Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4. Supabase Postgres via Prisma 8 (see Database). Firebase Authentication for the admin area and for customer accounts. Server Actions own all DB writes; the UI falls back to static/`localStorage` data when the database is unreachable so browsing never breaks.

**Composition:** `src/app/page.tsx` (server component) assembles the whole home page. `StickyAppBanner` is intentionally left commented out in `page.tsx` — don't "fix" that by re-enabling it unless asked.

**Routes:**

- `/` home, `/search?q=…` search results, `/my-booking` lookup by code+email.
- `/login`, `/register` — the customer sign-in / sign-up area (see "Customer accounts" below). `/account` — the signed-in customer's profile + their bookings.
- Four service-line indexes — `/vip-service`, `/transport`, `/tour-package`, `/evoa` — each fed by `getCatalog(lineSlug)` (DB-first, falls back to static `src/data/home.ts` content on error). Each line also has a `/<line>/[slug]` product detail page fed by `getProduct(slug)`.
- `/booking/[slug]` is the 4-step wizard (`BookingWizard` → contact → travelers → flight → payment → `StepResult`) driven by `createBooking`. On success it shows the booking code; on failure it surfaces the server error inline.

**Server Actions** (`src/app/actions/`):

- `search.ts` — `logSearch`, `getRecentSearches` (see Search flow).
- `catalog.ts` — `getCatalog(lineSlug)`, `getProduct(slug)`, `getOptions(kind)` (airports/cities/serviceTypes/airlines/countries), `getPaymentMethods()`. All return `null`/`[]` on error so the client can fall back.
- `booking.ts` — `createBooking(input)` (validates product/package/lead-time, re-computes totals server-side from DB cents, generates unique `BV-…` code, sequential inserts with compensating deletes on failure), `getBookingByCode(code, email)` (discriminated result).
- `admin.ts` — the admin area's data + mutation layer (see "Admin area" below). Also holds the reserved webadmin API (`upsertServiceType`, `upsertAirport`, `upsertPriceTier`, `upsertProduct`, `upsertPackage`, `upsertPaymentMethod`, `upsertAirline`, `upsertCountry`). **Every exported function throws unless `process.env.ADMIN_ENABLED === "1"` *and* the caller holds a valid admin session.** Validates integer USD-cent prices ≥ 0, slug/code uniqueness before write, `unitKind` consistency (`per_pax` → adult/child/infant; `per_unit` → unitUsdCents; duration → hours+extraHour), boolean active flags.
- `admin-auth.ts` — admin sign-in / sign-out (`signInAdmin`, `signOutAdmin`).
- `user-auth.ts` — customer sign-in / sign-up / sign-out (`signInUser`, `registerUser`, `signInUserWithGoogle`, `requestPasswordReset`, `signOutUser`, `getSessionUser`).

**Navigation:** `src/components/layout/NavBar.tsx` is the primary navbar — a working search form (submits to `/search?q=…`, index built in `src/data/search.ts`), the four service links (`serviceNav`) with `usePathname()` active state, and a mobile drawer behind a hamburger button. It is rendered inside `Header`, which is a client component with two variants: `overlay` (transparent over the home hero, becomes fixed + white after 80px of scroll) and `solid` (sticky white bar, used on the sub-pages). Both variants keep the navbar on every page.

**Search flow:** the home hero form (`HeroSearch`) selects a service with the category rail and fills real inputs; pressing **Search** navigates to that service page with the entered values in the query string (`/transport?pickup=…&pax=…&service=Transport`). Field keys per service live in `serviceSearchFields` (`src/data/services.ts`) and the field *kind* decides how the field renders: `select-airport` / `select-city` / `select-service-type` / `select-country` open a searchable dropdown, `datetime` renders a trigger that opens a date + time panel (the hour is stored in the sibling key `<key>Time`), `pax` renders the passenger counter (counts in `<key>Adults` / `<key>Children` / `<key>Infants`, plus a readable summary in `<key>`). The shared widgets are `src/components/ui/Popover.tsx` (a trigger + floating panel that closes on outside click or Escape and starts with a headless-UI style *focus guard*), `src/components/ui/DateTimePopover.tsx`, `src/components/ui/PaxPopover.tsx` and `src/components/ui/FieldShell.tsx`. The submitted search is stored twice: in the database (Server Action `logSearch` → `SearchLog` table, cross-device) and on the device (`src/lib/searchDraft.ts` localStorage — last search + five recent). The home form pre-fills from the local copy, the "Pencarian terakhir" section (`RecentSearches`) reads the database with a localStorage fallback, and the sub-page falls back to the local copy when the URL carries no values.

**Locale + currency:** `src/components/providers/LocaleProvider.tsx` is mounted in the root layout and exposes `useLocale()` — `{ lang, setLang, currency, setCurrency, formatMoney, rates, t }`. Language (`en` | `id`) and currency (`USD` | `IDR`) preferences are persisted in `localStorage`. `formatMoney(usd)` converts via `formatMoneyWith` in `src/lib/currency.ts` using live FX rates from the public **Frankfurter API**, cached in `localStorage` by date, with a hard-coded fallback (`IDR 16500/USD`) so prices always render offline. For snapshot rendering (my-booking shows what the customer agreed to), `formatSnapshot(usd, currencyCode, fxRate)` uses the fixed rate recorded at booking time. Translations live in `src/i18n/{en,id}.ts`; components take the dict key as a prop (the `"use client"` component calls `t("key")` from `useLocale()`), **not a translated string** — the key-as-prop rule keeps the component tree locale-agnostic and lets server-rendered copy flow through the same dictionary.

**Admin area (`/admin`):** a guarded, white/minimal back office for the catalog slice. It is *separate* from the public site — its own shell (`AdminShell`: sidebar + topbar), its own design tokens (`--admin-*` in `globals.css`), and it never touches `Header` / `Footer` / `LocaleProvider` styling.

- **Auth** — Firebase Authentication with session cookies, not NextAuth. `signInAdmin` posts email + password to the Identity Toolkit REST API from the server (the API key never reaches the browser), verifies the returned id token with `firebase-admin`, checks the email against the `ADMIN_EMAILS` allowlist, and only then issues an HttpOnly `admin_session` cookie. `src/lib/admin/session.ts` owns `getAdminSession()` (verify + allowlist), `createAdminSessionCookie()` and `clearAdminSessionCookie()`. `src/lib/firebase.ts` initialises the Firebase Admin app **lazily** so `next build` still succeeds without credentials.
- **Gates** — three of them, and all three must pass: `ADMIN_ENABLED=1` (deployment kill-switch), a valid Firebase session cookie, and an email on `ADMIN_EMAILS`. The env flag alone is *not* authorization; it only switches the surface off. Every admin server action calls `assertAdmin()` (env flag **and** session).
- **Routing** — Next 16 `src/proxy.ts` (the successor of `middleware.ts`, Node.js runtime) guards `/admin/:path*`. It only checks for the *presence* of the cookie; the cryptographic verification and the allowlist check happen server-side in `getAdminSession()`. The proxy deliberately never redirects `/admin/login` back to `/admin` — it cannot tell a valid cookie from a stale one, and doing so would loop; the login page performs that check itself. `ADMIN_ENABLED !== "1"` makes the proxy send every `/admin/*` request to `/`.
- **Route groups** — `src/app/admin/login/` is public; `src/app/admin/(secure)/` holds the guarded subtree. The guard lives in the `(secure)` layout behind a `<Suspense>` boundary (a `cookies()` read outside one is a build error under `cacheComponents`) and awaits `connection()` before verifying, because Firebase token verification reads the clock and `Date.now()` is not allowed while prerendering.
- **Routes** — `/admin` dashboard (counts per catalog table) and seven catalog tabs: `/admin/catalog/products`, `/packages`, `/service-types`, `/price-tiers`, `/places`, `/service-lines`, `/amenities`. Price tiers always show their **service-line scope** — labels repeat per line, so an operator must see which scope they are editing.
- **Components** (`src/components/admin/`) — `AdminShell`, `AdminSidebar`, `AdminTopbar`, `DataTable`, `AdminDrawer`, `Field`, `MoneyField`, `StatusToggle`, `EmptyState`, and `EntityManager`, the shared table + drawer + form that every tab plugs into (it owns the create/edit drawer, async initial values and inline error display). `MoneyField` edits **raw integer USD cents** and previews the value as `$12.00` underneath, per the admin spec.
- **Data access** — catalog lists load through server actions from client components (`listProducts`, `listPackages`, …), so the admin pages stay statically renderable and the database is never read during a prerender. Mutations are `upsert*` actions: an edit targets the row the operator picked **by `id`**, and the natural key (slug / label / code) must not already belong to a *different* row — creating a row with a taken natural key is rejected instead of silently overwriting it.

**Customer accounts (`/login`, `/register`, `/account`):** the customer-facing counterpart of the admin area, sharing the same Firebase project but never the same session.

- **Roles** — the Postgres `User.role` column (`ADMIN` | `USER`) is the single source of truth. `ADMIN_EMAILS` is only a **bootstrap allowlist**: the first time an allowlisted email signs in at `/admin/login`, `ensureAdminAccount` promotes its row to `ADMIN`. After that the DB decides, so access is revoked by setting `role = 'USER'` on the row. `src/lib/accounts.ts` owns `syncAccount` (mirror a Firebase identity into the DB), `ensureAdminAccount` (admin bootstrap) and the role helpers.
- **Two sessions, never mixed** — `admin_session` (`src/lib/admin/session.ts`) and `user_session` (`src/lib/user/session.ts`), both HttpOnly Firebase session cookies. `getAdminSession()` requires the DB row to be `ADMIN`; `getUserSession()` **rejects** `ADMIN` rows. An admin therefore cannot browse as a customer, and a customer cannot reach `/admin`. The customer session TTL is 8 h by default, or 14 days when "Ingat saya" is checked.
- **Identity** — email + password goes through the Identity Toolkit REST API from the server (`src/lib/identity.ts`), so the API key never reaches the browser. Google sign-in uses the Firebase **Web** SDK popup in the browser (`src/lib/firebase-client.ts`, `NEXT_PUBLIC_FIREBASE_*` config) and hands the id token to the server, which verifies it before issuing the cookie. Password reset uses the Identity Toolkit `sendOobCode` endpoint and always answers the same way, so the form cannot be used to probe which addresses have accounts.
- **Registration rules** — a new account always starts as `USER`. An allowlisted (admin) email is refused with a message pointing at the admin area. If the DB write fails, the freshly created Firebase user is deleted again so the address is not left half-created.
- **Pages** — `/login` and `/register` use the **split-screen** `AuthShell` (`src/components/auth/`): a dark-blue brand panel on the left (hidden below `lg`), the form on a white canvas on the right. **These two pages deliberately render without `Header` / `Footer`.** `AuthField` renders the labelled inputs and the password eye toggle; `GoogleButton` renders the popup flow. The email input is **controlled** — React resets uncontrolled form fields after a form action completes, which would otherwise wipe the address on a failed attempt.
- **`/account`** — the signed-in customer's page (email, name, role badge, "Pesanan saya" list from `listMyBookings()`) plus a `SignOutButton`. The header swaps "Masuk" for an account menu (`UserMenu`), and the mobile drawer gained an "Akun" entry.

**Folder layout:**

- `src/components/ui/` — shared primitives: `Container` (page gutter/max-width), `TabPills`, `Badge`, `PriceBlock` ("use client" — reads currency from `useLocale`), `Rating`, `Thumb`, `SectionHeading`, `Carousel`.
- `src/components/cards/` — one file per card type (`VipServiceCard`, `TransportCard`, `TourCard`, `EvoaCard`, `ProductCard`, …) plus a barrel `index.ts`. The price-rendering cards (`VipServiceCard`, `TransportCard`, `TourCard`, `EvoaCard`, `ProductCard`) are `"use client"` because they read currency from `useLocale`; the purely presentational ones (`ArticleCard`, `DestinationCard`, `PromoCard`) stay server components.
- `src/components/sections/` — page-level sections (`HeroSearch`, `SectionBand`, `SeoLinkGrid`, `Footer` (client — i18n), `ServiceLayout`, `ServiceCatalog`, `ServiceSearchSection`, `BookingPanel`, `SearchResults`, `ProductDetail` (client), `RecentSearches`, `BannerStrip` (client), …).
- `src/components/booking/` — wizard + my-booking widgets: `BookingBox` (entry point on product detail), `BookingWizard`, `StepDetails`, `StepAddOns`, `StepPayment`, `StepResult`, `BookingSummary`, `PaxStepper`, `WizardStepper`, `MyBookingLookup`. All client components.
- `src/components/layout/` — `Header`, `NavBar`, `LocaleMenu`, `Logo`, `UserMenu` (session-aware account link).
- `src/components/auth/` — `AuthShell` (the split-screen layout for `/login` + `/register`), `AuthField` (labelled input + password eye toggle), `GoogleButton` (Firebase Web SDK popup).
- `src/components/providers/` — `LocaleProvider` (root-mounted; see Locale + currency).
- `src/lib/` — `format.ts` (legacy `usd()` formatter), `currency.ts` (FX fetch + `formatMoneyWith`), `styles.ts` (card shell), `searchDraft.ts` (client-side search persistence), `accounts.ts` (the `User` role layer), `identity.ts` (server-side Firebase Identity Toolkit helpers), `firebase.ts` (server-only Firebase Admin), `firebase-client.ts` (browser-only Firebase Web SDK), `admin/session.ts` (`admin_session`), `user/session.ts` (`user_session`).
- `src/i18n/` — `en.ts`, `id.ts` (dictionaries — keys exported as `DictKey`), `index.ts` (`t()`, `makeTranslator()`).
- `src/types/` — all shared data types, exported from `src/types/index.ts` (includes catalog/booking DTOs).
- `src/components/icons.tsx` — the single icon module.

**Data flow:** copy, tabs, and SEO links still live in `src/data/home.ts`; service menus in `src/data/services.ts`; the search index in `src/data/search.ts`. Product/catalog data now comes from the database via `getCatalog` / `getProduct` actions, with the static data files acting as fallback. Components receive typed props (`CatalogDTO`, `ProductDetailDTO`, `BookingLookupResult`, …) imported from `@/types`. To change static fallback content, edit the data files; to change live catalog content, run the seeder (`npm run db:seed`) or use the reserved admin actions.

**Rendering boundary:** interactive widgets are `"use client"` — `Header`, `NavBar`, `HeroSearch`, `SectionBand`, `SeoLinkGrid`, `TabPills`, `Carousel`, `ServiceCatalog`, `BookingPanel`, `SearchResults`, `ProductDetail`, `BottomTabBar`, `StickyAppBanner`, `Footer` (reads i18n), `BannerStrip`, and the price-rendering cards (`VipServiceCard`, `TransportCard`, `TourCard`, `EvoaCard`, `ProductCard`) plus `PriceBlock`. Everything else (`SeoContent`, `Logo`, `Container`, `SectionHeading`, `ServiceLayout`, the presentational cards `ArticleCard` / `DestinationCard` / `PromoCard`, `icons.tsx`) is a server component. **Deliberate deviation from the original split:** `Footer`, `PriceBlock`, and the price-bearing cards had to become client components because they read currency/locale from `useLocale()` — there is no way to keep them server-rendered without giving up the live-currency feature. Keep the remaining presentational components as server components.

**Cards:** `src/components/cards/` maps each data type to a card component using shared `Badge`, `PriceBlock`, `Rating`, and `Thumb` primitives. Images are intentional gradient placeholders: each data record carries a Tailwind `tone` string (e.g. `"from-sky-400 to-blue-600"`) rendered through `Thumb`, not real image assets. The SVGs in `public/` are unused create-next-app leftovers.

**Styling system:** design tokens are declared in `src/app/globals.css` under `@theme inline` (e.g. `--color-brand`, `--color-ink`, `--color-muted`, `--color-line`, `--color-canvas`, `--color-brand-soft`, `--color-danger`). Use the semantic utilities (`bg-brand`, `text-ink`, `border-line`, `bg-canvas`) rather than raw hex values. Font is Figtree via `next/font/google`, exposed as `--font-figtree` and mapped to `--font-sans`.

**Icons:** hand-rolled inline SVGs in `src/components/icons.tsx` driven by a `base()` prop helper (24×24, currentColor, 2px stroke). Add new icons there instead of importing an icon library.

**Conventions:** `@/*` aliases `src/*` (see `tsconfig.json`). Prices in the data layer and database are **integer USD cents**; at render time `useLocale().formatMoney(usdCents)` converts via the Frankfurter FX rate into the user's chosen currency (`USD` / `IDR`). Layout is mobile-first — fixed `BottomTabBar` (safe-area padded) on mobile, absolute-over-hero `Header` on desktop, and every section wraps content in `<Container>` (`mx-auto max-w-[1200px] px-4 sm:px-6`). The root layout sets `viewportFit: "cover"` so the bottom bar respects device safe areas.