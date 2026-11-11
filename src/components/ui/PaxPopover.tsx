"use client";

import type { ReactNode } from "react";
import Popover from "@/components/ui/Popover";
import FieldShell from "@/components/ui/FieldShell";
import PaxStepper from "@/components/booking/PaxStepper";
import { ChevronDown, UsersIcon } from "@/components/icons";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { DictKey } from "@/i18n";

export type PaxCounts = {
  adults: number;
  children: number;
  infants: number;
};

export const DEFAULT_PAX: PaxCounts = { adults: 1, children: 0, infants: 0 };

/** "2 adults, 1 child" — zero counts are left out. */
export function formatPaxSummary(
  counts: PaxCounts,
  t: (key: DictKey, vars?: Record<string, string | number>) => string
): string {
  const parts: string[] = [];
  if (counts.adults > 0)
    parts.push(
      t("wizard.summary.adult", {
        n: counts.adults,
        plural: counts.adults > 1 ? "s" : "",
      })
    );
  if (counts.children > 0)
    parts.push(
      t("wizard.summary.child", {
        n: counts.children,
        plural: counts.children > 1 ? "s" : "",
      })
    );
  if (counts.infants > 0)
    parts.push(
      t("wizard.summary.infant", {
        n: counts.infants,
        plural: counts.infants > 1 ? "s" : "",
      })
    );
  return parts.join(", ");
}

/**
 * The passengers field of the search form — a trigger that opens a panel with
 * an adult / child / infant counter.
 */
export default function PaxPopover({
  label,
  value,
  onChange,
  icon = <UsersIcon width={18} height={18} />,
  placeholder,
  align = "right",
}: {
  label: string;
  value: PaxCounts;
  onChange: (counts: PaxCounts) => void;
  icon?: ReactNode;
  placeholder?: string;
  align?: "left" | "right";
}) {
  const { t } = useLocale();

  const summary = formatPaxSummary(value, t);

  return (
    <FieldShell icon={icon} label={label}>
      <Popover
        align={align}
        ariaLabel={label}
        panelClassName="w-[min(19rem,calc(100vw-2rem))]"
        trigger={
          <span
            className={`flex items-center gap-1 text-sm font-semibold ${
              summary ? "text-ink" : "text-muted"
            }`}
          >
            <span className="truncate">{summary || placeholder || label}</span>
            <ChevronDown width={16} height={16} className="shrink-0 text-muted" />
          </span>
        }
      >
        {({ close }) => (
          <div>
            <p className="mb-2 text-sm font-bold text-ink">{t("pax.title")}</p>

            <div className="space-y-2">
              <PaxStepper
                label={t("bookingBox.adults")}
                value={value.adults}
                min={1}
                max={20}
                onChange={(adults) => onChange({ ...value, adults })}
              />
              <PaxStepper
                label={t("bookingBox.children")}
                value={value.children}
                min={0}
                max={20}
                onChange={(children) => onChange({ ...value, children })}
              />
              <PaxStepper
                label={t("bookingBox.infants")}
                value={value.infants}
                min={0}
                max={20}
                onChange={(infants) => onChange({ ...value, infants })}
              />
            </div>

            <button
              type="button"
              onClick={close}
              className="mt-3 w-full rounded-xl bg-brand py-2 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
            >
              {t("pax.done")}
            </button>
          </div>
        )}
      </Popover>
    </FieldShell>
  );
}
