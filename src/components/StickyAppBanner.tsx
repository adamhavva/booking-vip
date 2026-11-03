"use client";

import { useState } from "react";
import { CloseIcon } from "./icons";

export default function StickyAppBanner() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 md:bottom-4">
      <div className="mx-auto flex max-w-[640px] items-center gap-3 bg-accent px-4 py-3 text-ink shadow-lg md:rounded-xl">
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="shrink-0 text-ink/70 hover:text-ink"
        >
          <CloseIcon width={18} height={18} />
        </button>
        <span className="h-7 w-7 shrink-0 rounded-full bg-white/60" />
        <p className="flex-1 text-sm font-semibold">
          Get 20% off your first VIP service with{" "}
          <span className="font-extrabold">&ldquo;VIPWELCOME&rdquo;</span>!
        </p>
        <button className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark">
          Claim
        </button>
      </div>
    </div>
  );
}
