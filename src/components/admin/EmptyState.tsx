import type { ReactNode } from "react";

/** Shown when a table has no rows yet. */
export default function EmptyState({
  title = "Belum ada data",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="text-[13px] font-medium text-[var(--admin-ink)]">{title}</p>
      {description ? (
        <p className="max-w-sm text-[13px] text-[var(--admin-muted)]">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
