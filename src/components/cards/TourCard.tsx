import { PinIcon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import PriceBlock from "@/components/ui/PriceBlock";
import Rating from "@/components/ui/Rating";
import Thumb from "@/components/ui/Thumb";
import { cardShell } from "@/lib/styles";
import type { Tour } from "@/types";

export default function TourCard({ tour }: { tour: Tour }) {
  return (
    <div className={cardShell}>
      <div className="relative">
        <Thumb tone={tour.tone} className="h-32 w-full" />
        <Badge variant="light" className="absolute left-2 top-2">
          {tour.duration}
        </Badge>
        {tour.ribbon && (
          <Badge variant="danger" className="absolute right-2 top-2">
            {tour.ribbon}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-ink">
          {tour.title}
        </h3>
        <p className="mb-1 flex items-center gap-1 text-xs text-muted">
          <PinIcon width={12} height={12} /> {tour.location}
        </p>
        <Rating rating={tour.rating} reviews={tour.reviews} />
        <div className="mt-auto">
          <span className="text-[11px] text-muted">Per person from</span>
          <PriceBlock from={tour.priceFrom} net={tour.priceNet} />
        </div>
      </div>
    </div>
  );
}