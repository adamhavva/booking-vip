"use client";

import { useMountedLocale } from "@/lib/useMountedLocale";

/** Price row: optional struck-through "from" price above the net price. */
export default function PriceBlock({
  from,
  net,
  unit,
}: {
  from?: number;
  net: number;
  unit?: string;
}) {
  const { formatMoney } = useMountedLocale();
  const hasDiscount = from != null && from > net;
  const discountPct = hasDiscount ? Math.round(((from - net) / from) * 100) : 0;

  return (
    <div className="mt-0.5">
      {hasDiscount && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted line-through">{formatMoney(from)}</span>
          {discountPct > 0 && (
            <span className="rounded bg-danger/10 px-1 py-px text-[10px] font-bold text-danger">
              {discountPct}%
            </span>
          )}
        </div>
      )}
      <div className="text-base font-bold text-ink">
        {formatMoney(net)}
        {unit && (
          <span className="text-xs font-normal text-muted"> {unit}</span>
        )}
      </div>
    </div>
  );
}
