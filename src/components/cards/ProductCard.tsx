"use client";

import Link from "next/link";
import { PinIcon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import PriceBlock from "@/components/ui/PriceBlock";
import Rating from "@/components/ui/Rating";
import CardImage from "@/components/ui/CardImage";
import { cardShell } from "@/lib/styles";
import type { ProductCardDTO } from "@/types";
import { pickLang } from "@/lib/content";
import { useMountedLocale } from "@/lib/useMountedLocale";

/**
 * Generic product card for DB-backed catalog data.
 * Renders similar to the existing cards but uses ProductCardDTO shape.
 * Copy is bilingual — the Indonesian variant is picked on the client.
 */
export default function ProductCard({
  product,
  href,
}: {
  product: ProductCardDTO;
  href: string;
}) {
  const { t, lang } = useMountedLocale();
  const title = pickLang(product.title, product.titleId, lang);
  const subtitle = pickLang(product.subtitle, product.subtitleId, lang);
  const ribbon = product.ribbon
    ? pickLang(product.ribbon, product.ribbonId, lang)
    : undefined;
  const durationLabel = product.durationLabel
    ? pickLang(product.durationLabel, product.durationLabelId, lang)
    : undefined;
  const serviceTypeName = product.serviceTypeName
    ? pickLang(product.serviceTypeName, product.serviceTypeNameId, lang)
    : undefined;
  const placeName = product.placeName
    ? pickLang(product.placeName, product.placeNameId, lang)
    : undefined;
  const unit = product.unit
    ? pickLang(product.unit, product.unitId, lang)
    : undefined;
  return (
    <Link href={href} className="block h-full">
      <div className={cardShell}>
        <div className="relative">
          <CardImage
            src={product.imageUrl}
            tone={product.tone}
            alt={title}
            className="aspect-[4/3] w-full"
          />
          {ribbon && (
            <Badge variant="danger" className="absolute left-2 top-2 shadow-sm">
              {ribbon}
            </Badge>
          )}
          {durationLabel && (
            <>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/45 to-transparent" />
              <Badge variant="light" className="absolute bottom-2 left-2">
                {durationLabel}
              </Badge>
            </>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          {serviceTypeName && (
            <span className="text-xs text-muted">{serviceTypeName}</span>
          )}
          <h3 className="mt-0.5 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-ink">
            {title}
          </h3>
          {placeName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <PinIcon width={12} height={12} className="shrink-0" />
              <span className="truncate">{placeName}</span>
            </p>
          )}
          {(product.rating != null && product.reviews != null) && (
            <div className="mt-1">
              <Rating rating={product.rating} reviews={product.reviews} />
            </div>
          )}
          <p className="mt-1 line-clamp-2 text-xs text-muted">{subtitle}</p>
          <div className="mt-auto pt-2">
            <span className="text-[11px] text-muted">{t("card.startingFrom")}</span>
            <PriceBlock from={product.fromUsd} net={product.priceUsd} unit={unit} />
          </div>
        </div>
      </div>
    </Link>
  );
}
