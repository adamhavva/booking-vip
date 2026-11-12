"use client";

import { useEffect, useState } from "react";
import { getHomePopupSettings } from "@/app/actions/popup";
import type { PopupSettingsDTO } from "@/lib/popup";
import HomePopupCard from "./HomePopupCard";

/**
 * The homepage popup.
 *
 * The configuration is fetched on the client, so the static homepage does not
 * become dynamic and a change in the admin area is live right away.
 */
export default function HomePopup() {
  const [settings, setSettings] = useState<PopupSettingsDTO | null>(null);

  useEffect(() => {
    let active = true;
    void getHomePopupSettings().then((value) => {
      if (active) setSettings(value);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!settings) return null;
  return <HomePopupCard settings={settings} />;
}
