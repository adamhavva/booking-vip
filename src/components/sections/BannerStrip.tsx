"use client";

import Image from "next/image";
import Container from "@/components/ui/Container";
import { copyText } from "@/lib/content";
import { useMountedLocale } from "@/lib/useMountedLocale";
import type { DictKey } from "@/i18n";
import type { CopyDTO } from "@/types";

export default function BannerStrip({
  title,
  subtitle,
  cta,
  tone = "from-blue-600 to-indigo-800",
  compact = false,
  titleKey,
  subtitleKey,
  ctaKey,
  titleCopy,
  subtitleCopy,
  ctaCopy,
  imageUrl,
  href,
}: {
  title: string;
  subtitle?: string;
  cta?: string;
  tone?: string;
  compact?: boolean;
  titleKey?: DictKey;
  subtitleKey?: DictKey;
  ctaKey?: DictKey;
  /** DB-backed bilingual copy (`Banner` table) — wins over `title`/`titleKey`. */
  titleCopy?: CopyDTO | null;
  subtitleCopy?: CopyDTO | null;
  ctaCopy?: CopyDTO | null;
  /** Photo behind the banner — a gradient is used when there is none. */
  imageUrl?: string | null;
  href?: string | null;
}) {
  const { t, lang } = useMountedLocale();

  const resolvedTitle = titleCopy ? copyText(titleCopy, lang) : titleKey ? t(titleKey) : title;
  const resolvedSubtitle = subtitleCopy
    ? copyText(subtitleCopy, lang)
    : subtitleKey
      ? t(subtitleKey)
      : subtitle;
  const resolvedCta = ctaCopy ? copyText(ctaCopy, lang) : ctaKey ? t(ctaKey) : cta;

  return (
    <Container className="py-4">
      <div
        className={`relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r ${tone} p-6 text-white ${
          compact ? "md:p-6" : "md:p-10"
        }`}
      >
        {imageUrl && (
          <>
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 1120px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/40" />
          </>
        )}

        <div className="relative">
          <h3 className="text-lg font-extrabold md:text-2xl">{resolvedTitle}</h3>
          {resolvedSubtitle && (
            <p className="mt-1 text-sm text-white/90 md:text-base">{resolvedSubtitle}</p>
          )}
        </div>
        {resolvedCta && (
          <a
            href={href ?? "#"}
            className="relative shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-brand hover:bg-white/90"
          >
            {resolvedCta}
          </a>
        )}
      </div>
    </Container>
  );
}
