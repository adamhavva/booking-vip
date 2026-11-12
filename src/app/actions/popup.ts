"use server";

import { getPopupSettings, isPopupLive, type PopupSettingsDTO } from "@/lib/popup";

/**
 * The public read path of the homepage popup.
 *
 * The homepage itself stays static — the popup configuration is fetched from
 * the client, so a change in the admin area is live without a redeploy and
 * without making every page dynamic.
 *
 * The date window is checked here (server side), so the browser only ever
 * receives a popup that is allowed to show.
 */
export async function getHomePopupSettings(): Promise<PopupSettingsDTO | null> {
  const settings = await getPopupSettings();
  if (!isPopupLive(settings)) return null;
  return settings;
}
