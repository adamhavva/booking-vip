"use client";

/**
 * A simple +/- stepper for passenger counts.
 */
export default function PaxStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
  price,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  price?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-white p-3">
      <div>
        <span className="text-sm font-semibold text-ink">{label}</span>
        {price && (
          <span className="ml-2 text-xs text-muted">{price}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-canvas disabled:opacity-30"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-bold text-ink">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-canvas disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}
