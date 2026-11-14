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
      <StarIcon width={13} height={13} className="shrink-0 text-accent" />
      <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
      {/* The review count is formatted with the browser locale — the server
          and the client can disagree ("1,240" vs "1.240"), so the mismatch
          is silenced here. */}
      <span suppressHydrationWarning>({reviews.toLocaleString()})</span>
    </div>
  );
}