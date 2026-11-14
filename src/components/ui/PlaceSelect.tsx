"use client";

import { useState } from "react";
import Popover from "@/components/ui/Popover";
import PlaceOptionList from "@/components/ui/PlaceOptionList";
import { ChevronDown, PinIcon, SearchIcon } from "@/components/icons";
import type { PlaceNode } from "@/lib/places";

/**
 * A place picker — a trigger that opens the searchable place hierarchy.
 *
 * The places cascade region → country → province → city → district →
 * village, with the leaf spots (airports, pick-up areas, tourist
 * destinations) below the node they belong to. Browsing drills one level at
 * a time (breadcrumb to walk back); searching shows the whole grouped tree.
 * A parent is selectable too when its kind is in `selectableKinds`.
 */
export default function PlaceSelect({
  label,
  places,
  value,
  onSelect,
  selectableKinds,
  placeholder,
  searchable = true,
}: {
  label: string;
  places: PlaceNode[];
  /** The currently selected label. */
  value: string;
  onSelect: (label: string) => void;
  /** The kinds that stay selectable even when they have children. */
  selectableKinds?: string[];
  placeholder?: string;
  searchable?: boolean;
}) {
  const [query, setQuery] = useState("");

  return (
    <div>
      <span className="mb-1.5 block text-[12px] font-medium text-ink">{label}</span>
      <Popover
        ariaLabel={label}
        panelClassName="w-[min(22rem,calc(100vw-2rem))]"
        trigger={
          <span
            className={`flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 text-[13px] transition-colors hover:bg-canvas ${
              value ? "text-ink" : "text-muted"
            }`}
          >
            <PinIcon width={16} height={16} className="shrink-0 text-muted" />
            <span className="min-w-0 flex-1 truncate">
              {value || placeholder || `Pilih ${label.toLowerCase()}`}
            </span>
            <ChevronDown width={16} height={16} className="shrink-0 text-muted" />
          </span>
        }
      >
        {({ close }) => (
          <div>
            {searchable && (
              <div className="relative mb-2">
                <SearchIcon
                  width={16}
                  height={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari wilayah, kota, atau tempat…"
                  className="w-full rounded-xl border border-line bg-canvas py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand"
                />
              </div>
            )}

            {places.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted">
                Belum ada data untuk dipilih.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <PlaceOptionList
                  nodes={places}
                  query={query}
                  selected={value}
                  selectableKinds={selectableKinds}
                  onSelect={(v) => {
                    close();
                    onSelect(v);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </Popover>
    </div>
  );
}
