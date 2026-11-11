"use client";

import { placeMatches, type PlaceNode } from "@/lib/places";

/**
 * The option list of a place dropdown.
 *
 * Places are shown as a hierarchy: a parent (e.g. "Jakarta") is a header and
 * its children (the airports below it) are the selectable options. The shape
 * comes from the database, so an operator can regroup the places at any time
 * without a code change.
 *
 * A place without children is a plain, selectable option.
 */
export default function PlaceOptionList({
  nodes,
  query,
  selected,
  onSelect,
}: {
  nodes: PlaceNode[];
  /** Free-text filter; parents stay visible while a child matches. */
  query?: string;
  /** The currently selected value (matched against the option value). */
  selected?: string;
  onSelect: (value: string) => void;
}) {
  const q = (query ?? "").trim().toLowerCase();

  return (
    <ul className="max-h-60 overflow-y-auto">
      <PlaceBranch
        nodes={nodes}
        query={q}
        selected={selected}
        onSelect={onSelect}
        depth={0}
      />
    </ul>
  );
}

/** One level of the tree — headers for parents, buttons for the leaves. */
function PlaceBranch({
  nodes,
  query,
  selected,
  onSelect,
  depth,
}: {
  nodes: PlaceNode[];
  query: string;
  selected?: string;
  onSelect: (value: string) => void;
  depth: number;
}) {
  const out: React.ReactNode[] = [];

  for (const node of nodes) {
    const selfMatches = !query || node.label.toLowerCase().includes(query);

    if (node.children.length > 0) {
      // A parent is only a header — it is not selectable itself.
      const children = selfMatches
        ? node.children
        : node.children.filter((child) => placeMatches(child, query));
      if (query && !selfMatches && children.length === 0) continue;

      out.push(
        <li key={node.id} className="pt-2 first:pt-0">
          <div
            className="flex items-center gap-2 px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-muted"
            style={depth > 0 ? { paddingLeft: `${12 + depth * 12}px` } : undefined}
          >
            <span className="truncate">{node.label}</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <PlaceBranch
            nodes={children}
            query={query}
            selected={selected}
            onSelect={onSelect}
            depth={depth + 1}
          />
        </li>
      );
      continue;
    }

    if (!selfMatches) continue;

    const isSelected = selected === node.value;

    out.push(
      <li key={node.id}>
        <button
          type="button"
          onClick={() => onSelect(node.value)}
          className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-canvas ${
            isSelected ? "bg-brand-soft font-semibold text-brand" : "text-ink"
          }`}
          style={depth > 0 ? { paddingLeft: `${12 + depth * 12}px` } : undefined}
        >
          <span className="truncate">{node.label}</span>
          {isSelected ? <span className="text-xs font-bold text-brand">✓</span> : null}
        </button>
      </li>
    );
  }

  return <>{out}</>;
}
