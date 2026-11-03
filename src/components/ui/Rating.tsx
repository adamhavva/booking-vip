import { StarIcon } from "@/components/icons";

export default function Rating({
  rating,
  reviews,
}: {
  rating: number;
  reviews: number;
}) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted">
      <StarIcon width={13} height={13} className="text-accent" />
      <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
      <span>/5 ({reviews.toLocaleString()})</span>
    </div>
  );
}