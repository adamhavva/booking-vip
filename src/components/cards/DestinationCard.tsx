import Thumb from "@/components/ui/Thumb";
import type { Destination } from "@/types";

export default function DestinationCard({ dest }: { dest: Destination }) {
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