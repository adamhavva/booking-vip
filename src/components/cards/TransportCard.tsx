"use client";

import Link from "next/link";
import { UsersIcon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import PriceBlock from "@/components/ui/PriceBlock";
import Thumb from "@/components/ui/Thumb";
import { cardShell } from "@/lib/styles";
import type { Transport } from "@/types";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function TransportCard({
  item,
  href,
}: {
  item: Transport;
  href?: string;
}) {
  const { t } = useLocale();
  const content = (
    <div className={cardShell}>
      <div className="relative">
        <Thumb tone={item.tone} className="h-28 w-full" />
        {item.ribbon && (
          <Badge variant="brand" className="absolute left-2 top-2">
            {item.ribbon}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <span className="text-[11px] text-muted">{item.category}</span>
        <h3 className="text-sm font-semibold text-ink">{item.model}</h3>
        <div className="my-2 flex gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <UsersIcon width={12} height={12} /> {item.seats}
          </span>
          <span>{item.bags} bags</span>
        </div>
        <div className="mt-auto">
          <span className="text-[11px] text-muted">{t("card.startingFrom")}</span>
          <PriceBlock from={item.priceFrom} net={item.priceNet} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-shadow hover:shadow-lg">
        {content}
      </Link>
    );
  }

  return content;
}