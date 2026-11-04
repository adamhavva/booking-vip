"use client";

import Container from "@/components/ui/Container";
import { useLocale } from "@/components/providers/LocaleProvider";

/**
 * Localised Suspense fallback for the search results page.
 * Extracted as a client component so it can call `useLocale().t()` —
 * the page itself is a server component and cannot.
 */
export default function SearchFallback() {
  const { t } = useLocale();
  return (
    <Container className="py-8">
      <p className="text-sm text-muted">{t("search.loading")}</p>
    </Container>
  );
}
