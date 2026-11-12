import { db } from "@/prisma/db";

/**
 * The e-VOA "how it works" steps.
 *
 * The copy lives in the `Setting` table (`evoa.howItWorks`) so it can be
 * edited without a deploy. Both languages are returned; the client picks the
 * one matching the active locale.
 */

export type EvoaStepDTO = {
  title: string;
  body: string;
};

export type EvoaStepsDTO = {
  en: EvoaStepDTO[];
  id: EvoaStepDTO[];
};

/** The fallback used when the database is unreachable. */
const FALLBACK: EvoaStepsDTO = { en: [], id: [] };

function readSteps(raw: unknown, key: "en" | "id"): EvoaStepDTO[] {
  if (!raw || typeof raw !== "object") return [];

  const record = raw as Record<string, unknown>;
  const list = record[key];
  if (!Array.isArray(list)) return [];

  return list.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const step = item as { title?: unknown; body?: unknown };
    if (typeof step.title !== "string" || typeof step.body !== "string") return [];
    return [{ title: step.title, body: step.body }];
  });
}

/** Read the three steps of the e-VOA explainer from the database. */
export async function getEvoaHowItWorks(): Promise<EvoaStepsDTO> {
  try {
    const rows = await db.orm.public.Setting
      .select("key", "value")
      .where({ key: "evoa.howItWorks" })
      .all();

    const raw = rows[0]?.value;
    if (raw == null) return FALLBACK;

    return {
      en: readSteps(raw, "en"),
      id: readSteps(raw, "id"),
    };
  } catch (error) {
    console.error("[evoa] could not load the how-it-works copy", error);
    return FALLBACK;
  }
}
