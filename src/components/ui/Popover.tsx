"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

export type PopoverPanelApi = {
  /** Closes the panel. */
  close: () => void;
};

type PopoverProps = {
  /** Content of the trigger button. */
  trigger: ReactNode;
  /** Panel content — receives a `close` helper. */
  children: (api: PopoverPanelApi) => ReactNode;
  /** Classes for the trigger button. */
  buttonClassName?: string;
  /** Classes for the floating panel. */
  panelClassName?: string;
  /** Which edge of the trigger the panel is anchored to. */
  align?: "left" | "right";
  /** Accessible name of the trigger. */
  ariaLabel?: string;
  /** Notified whenever the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
};

/**
 * A lightweight popover — a trigger button with a floating panel that closes
 * on outside click or Escape.
 *
 * The panel starts with a *focus guard* (the same markup headless UI
 * libraries render) so that keyboard focus entering the browser chrome
 * returns into the panel instead of escaping to the page behind it.
 */
export default function Popover({
  trigger,
  children,
  buttonClassName = "",
  panelClassName = "",
  align = "left",
  ariaLabel,
  onOpenChange,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const setOpenState = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenState(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenState(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpenState(!open)}
        className={`block w-full text-left ${buttonClassName}`}
      >
        {trigger}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          className={`absolute z-50 mt-2 rounded-2xl border border-line bg-white p-3 shadow-xl shadow-slate-900/10 ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName}`}
        >
          {/* Focus guard — keeps keyboard focus from escaping the panel. */}
          <div
            data-focus-guard="true"
            tabIndex={0}
            className="fixed left-px top-px h-0 w-0 overflow-hidden p-0"
          />
          {children({ close: () => setOpenState(false) })}
        </div>
      )}
    </div>
  );
}
