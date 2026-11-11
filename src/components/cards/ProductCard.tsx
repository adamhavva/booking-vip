"use client";

import Link from "next/link";
import { PinIcon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import PriceBlock from "@/components/ui/PriceBlock";
import Rating from "@/components/ui/Rating";
import CardImage from "@/components/ui/CardImage";
import { cardShell } from "@/lib/styles";
import type { ProductCardDTO } from "@/types";
import { useLocale } from "@/components/providers/LocaleProvider";

/**
 * Generic product card for DB-backed catalog data.
 * Renders similar to the existing cards but uses ProductCardDTO shape.
 */
export default function ProductCard({
  product,
  href,
}: {
  product: ProductCardDTO;
  href: string;
}) {
  const { t } = useLocale();
  return (
    <Link href={href} className="block transition-shadow hover:shadow-lg">
      <div className={cardShell}>
        <div className="relative">
          <CardImage
            src={product.imageUrl}
            tone={product.tone}
            alt={product.title}
            className="h-32 w-full"
          />
          {product.ribbon && (
            <Badge variant="danger" className="absolute left-2 top-2">
              {product.ribbon}
            </Badge>
          )}
          {product.durationLabel && (
            <Badge variant="light" className="absolute right-2 top-2">
              {product.durationLabel}
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3">
          {product.serviceTypeName && (
            <span className="text-[11px] text-muted">{product.serviceTypeName}</span>
          )}
          <h3 className="text-sm font-semibold text-ink">{product.title}</h3>
          {product.placeName && (
            <p className="mb-1 flex items-center gap-1 text-xs text-muted">
              <PinIcon width={12} height={12} /> {product.placeName}
            </p>
          )}
          {(product.rating != null && product.reviews != null) && (
            <Rating rating={product.rating} reviews={product.reviews} />
          )}
          <p className="mb-2 line-clamp-2 text-xs text-muted">{product.subtitle}</p>
          <div className="mt-auto">
            <span className="text-[11px] text-muted">{t("card.startingFrom")}</span>
            <PriceBlock from={product.fromUsd} net={product.priceUsd} unit={product.unit} />
          </div>
        </div>
      </div>
    </Link>
  );
}
