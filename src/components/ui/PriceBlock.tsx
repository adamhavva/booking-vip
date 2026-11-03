import { usd } from "@/lib/format";

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
  return (
    <div className="mt-1">
      {from && from > net && (
        <div className="text-xs text-muted line-through">{usd(from)}</div>
      )}
      <div className="text-base font-bold text-danger">
        {usd(net)}
        {unit && (
          <span className="text-[11px] font-normal text-muted"> {unit}</span>
        )}
      </div>
    </div>
  );
}