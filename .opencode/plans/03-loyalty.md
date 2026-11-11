# Plan 03 — Poin & Level (dinamis dari database)

Goal: points and level are **dynamic** — the levels live in the database, so an admin
can change a threshold without a deploy.

## Scope
- Schema: `LoyaltyLevel` (`code`, `name`, `minPoints`, `multiplier`, `benefits` json,
  `sortOrder`, `active`) + `User.points` (Int) and `User.levelId` (nullable FK).
- `src/lib/loyalty.ts`:
  - `listLoyaltyLevels()` — active levels, ordered by `minPoints`.
  - `resolveLevel(points)` — the level whose `minPoints` is the highest one `<= points`.
  - `pointsToNextLevel(points)` — the next level + how many points are missing.
- `src/app/account/loyalty/page.tsx` — progress card: current level, points, the next
  level and a progress bar, plus the list of levels and their benefits.
- The points are awarded from the database (seeded per level); earning points from
  bookings is left for a later plan.

## Done when
- The page shows the level table from the DB and the progress towards the next level.
