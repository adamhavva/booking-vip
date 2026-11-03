import { idr } from "@/lib/format";
import { StarIcon, PinIcon, UsersIcon, CheckIcon, CalendarIcon } from "./icons";
import type {
  VipService,
  Transport,
  Tour,
  EvoaPlan,
  Destination,
  Article,
  Promo,
} from "@/data/home";

/* Generic image placeholder (gradient block) — stands in for a photo. */
function Thumb({ tone, className = "" }: { tone: string; className?: string }) {
  return <div className={`bg-gradient-to-br ${tone} ${className}`} aria-hidden />;
}

function Rating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted">
      <StarIcon width={13} height={13} className="text-accent" />
      <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
      <span>/5 ({reviews.toLocaleString()})</span>
    </div>
  );
}

function Price({ from, net, unit }: { from?: number; net: number; unit?: string }) {
  return (
    <div className="mt-1">
      {from && from > net && (
        <div className="text-xs text-muted line-through">{idr(from)}</div>
      )}
      <div className="text-base font-bold text-danger">
        {idr(net)}
        {unit && <span className="text-[11px] font-normal text-muted"> {unit}</span>}
      </div>
    </div>
  );
}

const cardShell =
  "flex w-[240px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-md";

export function VipServiceCard({ service }: { service: VipService }) {
  return (
    <div className={cardShell}>
      <div className="relative">
        <Thumb tone={service.tone} className="h-32 w-full" />
        {service.ribbon && (
          <span className="absolute left-2 top-2 rounded-md bg-danger px-2 py-0.5 text-[10px] font-bold text-white">
            {service.ribbon}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="text-sm font-semibold text-ink">{service.title}</h3>
        <p className="mb-1 flex items-center gap-1 text-xs text-muted">
          <PinIcon width={12} height={12} /> {service.airport}
        </p>
        <p className="mb-2 line-clamp-2 text-xs text-muted">{service.desc}</p>
        <div className="mt-auto">
          <span className="text-[11px] text-muted">Starting from</span>
          <Price from={service.priceFrom} net={service.priceNet} unit="/pax" />
        </div>
      </div>
    </div>
  );
}

export function TransportCard({ item }: { item: Transport }) {
  return (
    <div className={cardShell}>
      <div className="relative">
        <Thumb tone={item.tone} className="h-28 w-full" />
        {item.ribbon && (
          <span className="absolute left-2 top-2 rounded-md bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
            {item.ribbon}
          </span>
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
          <Price from={item.priceFrom} net={item.priceNet} />
        </div>
      </div>
    </div>
  );
}

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <div className={cardShell}>
      <div className="relative">
        <Thumb tone={tour.tone} className="h-32 w-full" />
        <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-ink">
          {tour.duration}
        </span>
        {tour.ribbon && (
          <span className="absolute right-2 top-2 rounded-md bg-danger px-2 py-0.5 text-[10px] font-bold text-white">
            {tour.ribbon}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-ink">{tour.title}</h3>
        <p className="mb-1 flex items-center gap-1 text-xs text-muted">
          <PinIcon width={12} height={12} /> {tour.location}
        </p>
        <Rating rating={tour.rating} reviews={tour.reviews} />
        <div className="mt-auto">
          <span className="text-[11px] text-muted">Per person from</span>
          <Price from={tour.priceFrom} net={tour.priceNet} />
        </div>
      </div>
    </div>
  );
}

export function EvoaCard({ plan }: { plan: EvoaPlan }) {
  return (
    <div className="flex w-[260px] shrink-0 snap-start flex-col rounded-xl border border-line bg-white p-4 transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">{plan.name}</h3>
        {plan.ribbon && (
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
            {plan.ribbon}
          </span>
        )}
      </div>
      <p className="mb-3 flex items-center gap-1 text-xs text-muted">
        <PinIcon width={12} height={12} /> {plan.destination}
      </p>
      <ul className="mb-3 space-y-1.5 text-xs text-ink">
        <li className="flex items-center gap-2">
          <CheckIcon width={14} height={14} className="text-success" /> Stay up to {plan.stay}
        </li>
        <li className="flex items-center gap-2">
          <CalendarIcon width={14} height={14} className="text-brand" /> Processing in {plan.processing}
        </li>
      </ul>
      <div className="mt-auto border-t border-line pt-3">
        <span className="text-[11px] text-muted">From</span>
        <Price net={plan.priceNet} unit="/person" />
      </div>
    </div>
  );
}

export function DestinationCard({ dest }: { dest: Destination }) {
  return (
    <div className="relative h-56 w-[200px] shrink-0 snap-start overflow-hidden rounded-xl">
      <Thumb tone={dest.tone} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-3 left-3 text-white">
        <p className="text-[11px] opacity-90">{dest.country}</p>
        <h3 className="text-lg font-bold">{dest.name}</h3>
      </div>
    </div>
  );
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="w-[260px] shrink-0 snap-start overflow-hidden rounded-xl border border-line bg-white">
      <Thumb tone={article.tone} className="h-32 w-full" />
      <div className="p-3">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
          {article.category}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold text-ink">{article.title}</h3>
      </div>
    </div>
  );
}

export function PromoCard({ promo }: { promo: Promo }) {
  return (
    <div
      className={`flex h-40 w-[320px] shrink-0 snap-start flex-col justify-end rounded-xl bg-gradient-to-br ${promo.tone} p-4 text-white`}
    >
      <h3 className="text-lg font-extrabold">{promo.title}</h3>
      <p className="text-sm opacity-90">{promo.subtitle}</p>
    </div>
  );
}
