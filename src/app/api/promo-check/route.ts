import { NextResponse, connection } from "next/server";
import { getCampaignDiscounts } from "@/app/actions/promo";

/**
 * TEMPORARY verification endpoint for the stacked-discount feature — removed
 * after the feature is verified. Returns the public averaged percents.
 */
export async function GET() {
  await connection();
  return NextResponse.json(await getCampaignDiscounts());
}