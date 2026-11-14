"use client";

import CardImage from "@/components/ui/CardImage";
import { copyText } from "@/lib/content";
import { useMountedLocale } from "@/lib/useMountedLocale";
import type { DestinationDTO } from "@/types";

/** A destination tile — DB-backed (`Destination` table), bilingual. */
export default function DestinationCard({ dest }: { dest: DestinationDTO }) {
  const { lang } = useMountedLocale();

  return (
    <div className="relative h-56 w-[200px] shrink-0 snap-start overflow-hidden rounded-xl border border-line shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardImage
        src={dest.imageUrl}
        tone={dest.tone}
        alt={copyText(dest.name, lang)}
        className="absolute inset-0 h-full w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-3 left-3 text-white">
        {dest.country ? (
          <p className="text-[11px] opacity-90">{copyText(dest.country, lang)}</p>
        ) : null}
        <h3 className="text-lg font-bold">{copyText(dest.name, lang)}</h3>
      </div>
    </div>
  );
}
