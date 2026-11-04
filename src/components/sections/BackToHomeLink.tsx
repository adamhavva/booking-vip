"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/LocaleProvider";

/**
 * Translated "← Back to home" link. Extracted as a client component so
 * `ServiceLayout` (a server component) can render a locale-aware back link
 * without becoming a client component itself.
 */
export default function BackToHomeLink() {
  const { t } = useLocale();
  return (
    <Link
      href="/"
      className="text-sm font-semibold text-white/70 hover:text-white"
    >
      &larr; {t("home.backToHome")}
    </Link>
  );
}
