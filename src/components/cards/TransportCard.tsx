import { UsersIcon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import PriceBlock from "@/components/ui/PriceBlock";
import Thumb from "@/components/ui/Thumb";
import { cardShell } from "@/lib/styles";
import type { Transport } from "@/types";

export default function TransportCard({ item }: { item: Transport }) {
  return (
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
          <span className="text-[11px] text-muted">Starting from</span>
          <PriceBlock from={item.priceFrom} net={item.priceNet} />
        </div>
      </div>
    </div>
  );
}