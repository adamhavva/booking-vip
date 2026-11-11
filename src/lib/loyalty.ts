import { db } from "@/prisma/db";

/**
 * Loyalty levels.
 *
 * The tiers live in the database (`LoyaltyLevel`), so a threshold can be
 * changed by an operator without a deploy. `resolveLevel()` picks the tier
 * whose `minPoints` is the highest one that is still `<= points`.
 */

export type LoyaltyLevelDTO = {
  id: string;
  code: string;
  name: string;
  minPoints: number;
  multiplier: number;
  benefits: string[];
  sortOrder: number;
  active: boolean;
};

/** All the active levels, ordered from the lowest threshold. */
export async function listLoyaltyLevels(): Promise<LoyaltyLevelDTO[]> {
  const rows = await db.orm.public.LoyaltyLevel
    .select("id", "code", "name", "minPoints", "multiplier", "benefits", "sortOrder", "active")
    .orderBy((f) => f.minPoints.asc())
    .all();

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    minPoints: row.minPoints,
    multiplier: row.multiplier,
    benefits: toStringArray(row.benefits),
    sortOrder: row.sortOrder,
    active: row.active,
  }));
}

/** The level that matches a point total. */
export function resolveLevel(
  levels: LoyaltyLevelDTO[],
  points: number,
): LoyaltyLevelDTO | null {
  if (levels.length === 0) return null;

  let current: LoyaltyLevelDTO | null = null;
  for (const level of levels) {
    if (level.minPoints <= points) current = level;
    else break;
  }

  // Below the first threshold the customer still belongs to the base tier.
  return current ?? levels[0]!;
}

/** The next level and how many points are still missing. */
export function pointsToNextLevel(
  levels: LoyaltyLevelDTO[],
  points: number,
): { next: LoyaltyLevelDTO | null; missing: number } {
  const next = levels.find((level) => level.minPoints > points) ?? null;
  return { next, missing: next ? Math.max(0, next.minPoints - points) : 0 };
}

/** Read a string list out of a JSON column. */
function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}
