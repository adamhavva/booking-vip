import type { ReactNode } from "react";

/**
 * The shared look of every field in the search form — a soft canvas pill with
 * an icon, a tiny label and the control itself.
 */
export default function FieldShell({
  icon,
  label,
  children,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-canvas px-4 py-2.5 ${className}`}
    >
      <span className="shrink-0 text-muted">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] text-muted">{label}</span>
        {children}
      </span>
    </div>
  );
}
