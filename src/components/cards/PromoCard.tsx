"use client";

import CardImage from "@/components/ui/CardImage";
import { copyText } from "@/lib/content";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { PromoDTO } from "@/types";

/** A promo tile — DB-backed (`Promo` table), bilingual via `copyText`. */
export default function PromoCard({ promo }: { promo: PromoDTO }) {
  const { lang } = useLocale();

  return (
    <div className="relative h-40 w-[320px] shrink-0 snap-start overflow-hidden rounded-xl text-white">
      <CardImage
        src={promo.imageUrl}
        tone={promo.tone}
        alt={copyText(promo.title, lang)}
        className="absolute inset-0 h-full w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/5" />
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <h3 className="text-lg font-extrabold">{copyText(promo.title, lang)}</h3>
        {promo.subtitle ? (
          <p className="text-sm opacity-90">{copyText(promo.subtitle, lang)}</p>
        ) : null}
      </div>
    </div>
  );
}
