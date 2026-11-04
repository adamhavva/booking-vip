import Link from "next/link";
import { PinIcon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import PriceBlock from "@/components/ui/PriceBlock";
import Thumb from "@/components/ui/Thumb";
import { cardShell } from "@/lib/styles";
import type { VipService } from "@/types";

export default function VipServiceCard({
  service,
  href,
}: {
  service: VipService;
  href?: string;
}) {
  const content = (
    <div className={cardShell}>
      <div className="relative">
        <Thumb tone={service.tone} className="h-32 w-full" />
        {service.ribbon && (
          <Badge variant="danger" className="absolute left-2 top-2">
            {service.ribbon}
          </Badge>
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
          <PriceBlock from={service.priceFrom} net={service.priceNet} unit="/pax" />
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