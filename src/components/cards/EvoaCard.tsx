import { CalendarIcon, CheckIcon, PinIcon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import PriceBlock from "@/components/ui/PriceBlock";
import type { EvoaPlan } from "@/types";

export default function EvoaCard({ plan }: { plan: EvoaPlan }) {
  return (
    <div className="flex w-[260px] shrink-0 snap-start flex-col rounded-xl border border-line bg-white p-4 transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">{plan.name}</h3>
        {plan.ribbon && <Badge variant="soft">{plan.ribbon}</Badge>}
      </div>
      <p className="mb-3 flex items-center gap-1 text-xs text-muted">
        <PinIcon width={12} height={12} /> {plan.destination}
      </p>
      <ul className="mb-3 space-y-1.5 text-xs text-ink">
        <li className="flex items-center gap-2">
          <CheckIcon width={14} height={14} className="text-success" /> Stay up
          to {plan.stay}
        </li>
        <li className="flex items-center gap-2">
          <CalendarIcon width={14} height={14} className="text-brand" />{" "}
          Processing in {plan.processing}
        </li>
      </ul>
      <div className="mt-auto border-t border-line pt-3">
        <span className="text-[11px] text-muted">From</span>
        <PriceBlock net={plan.priceNet} unit="/person" />
      </div>
    </div>
  );
}