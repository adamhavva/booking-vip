"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import {
  findPlacePath,
  placeKindLabel,
  placeMatches,
  type PlaceNode,
} from "@/lib/places";

/**
 * The option list of a place dropdown.
 *
 * Places are shown as a hierarchy: region → country → province → city →
 * district → village, with the leaf spots (airports, pick-up areas, tourist
 * destinations) below the node they belong to. The shape comes from the
 * database, so an operator can regroup the places at any time without a
 * code change.
 *
 * Two modes:
 * - **Browse (no query):** a cascading drill-down. Only one level is shown
 *   at a time; tapping a parent opens its children, and a breadcrumb trail
 *   walks back up. A parent of a "selectable" kind keeps its select button
 *   next to the drill affordance.
 * - **Search (query set):** the full grouped tree, parents as headers and
 *   matching descendants as options — the classic flat search view.
 */
export default function PlaceOptionList({
  nodes,
  query,
  selected,
  onSelect,
  selectableKinds,
}: {
  nodes: PlaceNode[];
  /** Free-text filter; parents stay visible while a child matches. */
  query?: string;
  /** The currently selected value (matched against the option value). */
  selected?: string;
  onSelect: (value: string) => void;
  /**
   * The kinds that are selectable even when they have children.
   *
   * By default a parent is only a group header; the transport flow wants the
   * city *and* the areas below it to be pickable.
   */
  selectableKinds?: string[];
}) {
  const q = (query ?? "").trim().toLowerCase();

  // The drill path — the chain of parents whose children are on screen.
  // It starts at the level of the current selection so re-opening the
  // dropdown lands where the customer left off.
  const [path, setPath] = useState<PlaceNode[]>(() =>
    initialPath(nodes, selected),
  );

  // A new tree (e.g. another service tab) resets the drill to the selection.
  useEffect(() => {
    setPath(initialPath(nodes, selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  // Searching always shows the whole grouped tree, regardless of the drill.
  if (q) {
    return (
      <ul className="max-h-60 overflow-y-auto">
        <PlaceBranch
          nodes={nodes}
          query={q}
          selected={selected}
          onSelect={onSelect}
          selectableKinds={selectableKinds}
          depth={0}
        />
      </ul>
    );
  }

  const current = path.length > 0 ? path[path.length - 1]! : null;
  const levelNodes = current ? current.children : nodes;

  return (
    <div>
      {/* Breadcrumb — walk back up the hierarchy. */}
      <nav
        aria-label="Tingkatan wilayah"
        className="mb-1 flex flex-wrap items-center gap-1 px-3 pt-1 text-[11px]"
      >
        <button
          type="button"
          onClick={() => setPath([])}
          className={`rounded-md px-1.5 py-0.5 font-semibold transition-colors hover:bg-canvas ${
            path.length === 0 ? "text-brand" : "text-muted"
          }`}
        >
          Semua
        </button>
        {path.map((node, index) => (
          <span key={node.id} className="flex min-w-0 items-center gap-1">
            <ChevronRight width={12} height={12} className="shrink-0 text-muted" />
            <button
              type="button"
              onClick={() => setPath(path.slice(0, index + 1))}
              className={`max-w-[10rem] truncate rounded-md px-1.5 py-0.5 font-semibold transition-colors hover:bg-canvas ${
                index === path.length - 1 ? "text-brand" : "text-muted"
              }`}
            >
              {node.label}
            </button>
          </span>
        ))}
      </nav>

      {current ? (
        <button
          type="button"
          onClick={() => setPath(path.slice(0, -1))}
          className="mx-3 mb-1 flex items-center gap-1 rounded-lg px-1 py-1 text-[12px] font-semibold text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <ChevronLeft width={14} height={14} />
          Kembali
        </button>
      ) : null}

      <ul className="max-h-60 overflow-y-auto">
        {levelNodes.length === 0 ? (
          <li className="px-3 py-6 text-center text-xs text-muted">
            Belum ada data untuk dipilih.
          </li>
        ) : (
          levelNodes.map((node) => (
            <DrillRow
              key={node.id}
              node={node}
              selected={selected}
              selectableKinds={selectableKinds}
              onSelect={onSelect}
              onDrill={() => setPath([...path, node])}
            />
          ))
        )}
      </ul>
    </div>
  );
}

/** The drill path a fresh dropdown opens with — the ancestors of the selection. */
function initialPath(nodes: PlaceNode[], selected?: string): PlaceNode[] {
  const chain = findPlacePath(nodes, selected ?? "");
  // Stop at the parent of the selected node so the selection stays visible.
  return chain.slice(0, Math.max(0, chain.length - 1));
}

/**
 * One row of the drill-down level.
 *
 * A parent drills into its children; a parent of a selectable kind is also
 * pickable itself (select button + a separate drill button). A leaf selects.
 */
function DrillRow({
  node,
  selected,
  selectableKinds,
  onSelect,
  onDrill,
}: {
  node: PlaceNode;
  selected?: string;
  selectableKinds?: string[];
  onSelect: (value: string) => void;
  onDrill: () => void;
}) {
  const hasChildren = node.children.length > 0;
  const isSelectable =
    !hasChildren || (selectableKinds?.includes(node.kind) ?? false);
  const isSelected = selected === node.value;

  return (
    <li className="flex items-center gap-1 px-3">
      {isSelectable ? (
        <button
          type="button"
          onClick={() => onSelect(node.value)}
          className={`flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-canvas ${
            isSelected ? "bg-brand-soft font-semibold text-brand" : "text-ink"
          }`}
        >
          <span className="min-w-0 truncate">
            {node.label}
            {hasChildren ? (
              <span className="ml-2 text-[11px] font-normal text-muted">
                {placeKindLabel(node.kind)}
              </span>
            ) : null}
          </span>
          {isSelected ? (
            <span className="shrink-0 text-xs font-bold text-brand">✓</span>
          ) : null}
        </button>
      ) : (
        <button
          type="button"
          onClick={onDrill}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold text-ink transition-colors hover:bg-canvas"
        >
          <span className="min-w-0 truncate">{node.label}</span>
          <span className="shrink-0 text-[11px] font-normal text-muted">
            {placeKindLabel(node.kind)}
          </span>
        </button>
      )}

      {hasChildren ? (
        <button
          type="button"
          onClick={onDrill}
          aria-label={`Lihat ${node.label}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <ChevronRight width={16} height={16} />
        </button>
      ) : null}
    </li>
  );
}

/** One level of the tree — headers for parents, buttons for the leaves. */
function PlaceBranch({
  nodes,
  query,
  selected,
  onSelect,
  selectableKinds,
  depth,
}: {
  nodes: PlaceNode[];
  query: string;
  selected?: string;
  onSelect: (value: string) => void;
  selectableKinds?: string[];
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

      // A parent of a "selectable" kind (a city in the transport flow) is a
      // button first and a group second.
      const isSelectable = selectableKinds?.includes(node.kind) ?? false;
      const isSelected = selected === node.value;

      out.push(
        <li key={node.id} className="pt-2 first:pt-0">
          {isSelectable ? (
            <button
              type="button"
              onClick={() => onSelect(node.value)}
              className={`mx-3 mb-1 flex w-[calc(100%-1.5rem)] items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-bold transition-colors hover:bg-canvas ${
                isSelected ? "bg-brand-soft text-brand" : "text-ink"
              }`}
              style={depth > 0 ? { marginLeft: `${depth * 12}px` } : undefined}
            >
              <span className="truncate">{node.label}</span>
              {isSelected ? <span className="text-xs font-bold text-brand">✓</span> : null}
            </button>
          ) : (
            <div
              className="flex items-center gap-2 px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-muted"
              style={depth > 0 ? { paddingLeft: `${12 + depth * 12}px` } : undefined}
            >
              <span className="truncate">{node.label}</span>
              <span className="h-px flex-1 bg-line" />
            </div>
          )}
          {/* A nested list — a <ul> inside the <li>, never a <li> inside a
              <li> (invalid HTML, and a hydration error in React). */}
          <ul className="list-none">
            <PlaceBranch
              nodes={children}
              query={query}
              selected={selected}
              onSelect={onSelect}
              selectableKinds={selectableKinds}
              depth={depth + 1}
            />
          </ul>
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