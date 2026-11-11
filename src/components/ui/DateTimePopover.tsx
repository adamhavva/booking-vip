"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Popover from "@/components/ui/Popover";
import FieldShell from "@/components/ui/FieldShell";
import { CalendarIcon, ChevronDown, ClockIcon } from "@/components/icons";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatDateLabel, localeFor, todayISO } from "@/lib/format";

/** Shortcuts offered under the time input. */
const QUICK_TIMES = [
  "06:00",
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "20:00",
  "22:00",
];

/**
 * The date field of the search form — one trigger that shows the picked day
 * and hour, opening a panel with a date input, a time input and a row of
 * quick time slots.
 */
export default function DateTimePopover({
  label,
  date,
  time,
  onDate,
  onTime,
  icon = <CalendarIcon width={18} height={18} />,
  placeholder,
  align = "left",
  timeSlots,
}: {
  label: string;
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:MM` */
  time: string;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
  icon?: ReactNode;
  placeholder?: string;
  align?: "left" | "right";
  /** Quick time slots — from the database, falling back to the defaults. */
  timeSlots?: string[];
}) {
  const { t, lang } = useLocale();

  // The earliest bookable day is resolved on the client — reading the clock
  // during prerender is not allowed.
  const [min, setMin] = useState("");
  useEffect(() => {
    setMin(todayISO());
  }, []);

  const display = useMemo(() => {
    if (!date && !time) return "";
    const day = date ? formatDateLabel(date, localeFor(lang)) : "";
    return [day, time].filter(Boolean).join(", ");
  }, [date, time, lang]);

  return (
    <FieldShell icon={icon} label={label}>
      <Popover
        align={align}
        ariaLabel={label}
        panelClassName="w-[min(21rem,calc(100vw-2rem))]"
        trigger={
          <span
            className={`flex items-center gap-1.5 text-sm font-semibold ${
              display ? "text-ink" : "text-muted"
            }`}
          >
            <span className="truncate">{display || placeholder || label}</span>
            <ChevronDown
              width={16}
              height={16}
              className="shrink-0 text-muted"
            />
          </span>
        }
      >
        {({ close }) => (
          <div className="space-y-4">
            {/* Day */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                {t("search.date")}
              </p>
              <input
                type="date"
                value={date}
                min={min}
                onChange={(e) => onDate(e.target.value)}
                aria-label={t("search.date")}
                className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm font-semibold text-ink outline-none transition-colors focus:border-brand [color-scheme:light]"
              />
            </div>

            {/* Hour */}
            <div className="border-t border-line pt-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <ClockIcon width={13} height={13} />
                {t("search.time")}
              </p>
              <input
                type="time"
                value={time}
                onChange={(e) => onTime(e.target.value)}
                aria-label={t("search.time")}
                className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm font-semibold text-ink outline-none transition-colors focus:border-brand [color-scheme:light]"
              />

              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {(timeSlots?.length ? timeSlots : QUICK_TIMES).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onTime(slot)}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-semibold tabular-nums transition-colors ${
                      time === slot
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line bg-white text-muted hover:border-brand/40 hover:text-ink"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={close}
              className="w-full rounded-xl bg-brand py-2 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
            >
              {t("search.done")}
            </button>
          </div>
        )}
      </Popover>
    </FieldShell>
  );
}
