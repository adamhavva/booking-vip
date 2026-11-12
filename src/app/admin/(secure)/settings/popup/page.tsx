import type { Metadata } from "next";
import PopupSettingsForm from "./PopupSettingsForm";

export const metadata: Metadata = {
  title: "Popup Homepage · Admin",
  robots: { index: false, follow: false },
};

/** The homepage popup settings. */
export default function AdminPopupSettingsPage() {
  return <PopupSettingsForm />;
}
