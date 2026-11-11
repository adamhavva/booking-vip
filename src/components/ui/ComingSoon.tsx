import type { ReactNode } from "react";

/**
 * The "coming soon" placeholder.
 *
 * A centred card on a white surface — the pattern used for every page of
 * the site that is not finished yet.
 */
export default function ComingSoon({
  title = "Segera Hadir",
  description = "Halaman ini sedang kami kerjakan. Silakan kembali lagi nanti.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-10 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 7v5l3 2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="8.5"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
        </span>

        <h1 className="mt-4 text-[19px] font-bold tracking-[-0.01em] text-ink">{title}</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{description}</p>

        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
