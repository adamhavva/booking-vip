/**
 * Places — the shared location hierarchy.
 *
 * Every place (airport, city, …) lives in one table and may point at a
 * parent place. The hierarchy is therefore data-driven: an operator decides
 * in the admin area that "Soekarno-Hatta" belongs under "Jakarta", and the
 * dropdowns group themselves accordingly. Nothing here is hardcoded.
 *
 * The helpers are pure functions on plain rows so they can be reused by the
 * server actions, the admin screens and the client components alike.
 */

/**
 * The kinds of place a row can have.
 *
 * - `airport` — a_bandara, usually a child of a `city`;
 * - `city` — a city or region, the parent of the places below it;
 * - `area` — a pick-up area inside a city (transport);
 * - `destination` — a tourist destination inside a city (tour packages).
 */
export type PlaceKind = "airport" | "city" | "area" | "destination";

/** The human label of a place kind. */
export function placeKindLabel(kind: string): string {
  switch (kind) {
    case "airport":
      return "Airport";
    case "city":
      return "Kota";
    case "area":
      return "Area";
    case "destination":
      return "Destinasi";
    default:
      return kind;
  }
}

/** The raw place row the tree is built from. */
export type PlaceRow = {
  id: string;
  kind: string;
  iataCode: string | null;
  name: string;
  city: string;
  country: string;
  parentId: string | null;
  sortOrder: number;
};

/** One node of the place tree. */
export type PlaceNode = {
  id: string;
  /** Display label ("Soekarno-Hatta (CGK)"). */
  label: string;
  /** Value submitted by the form (same as the label, for compatibility). */
  value: string;
  kind: string;
  children: PlaceNode[];
};

/**
 * The label of a place: the airport name plus its IATA code, the plain name
 * for everything else.
 */
export function placeLabel(row: {
  kind: string;
  name: string;
  iataCode: string | null;
}): string {
  if (row.kind === "airport" && row.iataCode) {
    return `${row.name} (${row.iataCode})`;
  }
  return row.name;
}

/**
 * Build the place tree from a flat list of rows.
 *
 * A row whose parent is missing becomes a root, and a parent link that would
 * close a cycle is ignored — a broken link can never hide a place.
 */
export function buildPlaceTree(rows: PlaceRow[]): PlaceNode[] {
  const known = new Set(rows.map((r) => r.id));
  const parentOf = new Map<string, string>();

  for (const row of rows) {
    const parentId = row.parentId;
    if (!parentId || !known.has(parentId) || parentId === row.id) continue;
    if (createsCycle(rows, row.id, parentId)) continue;
    parentOf.set(row.id, parentId);
  }

  const childrenOf = new Map<string, string[]>();
  const roots: string[] = [];

  for (const row of rows) {
    const parentId = parentOf.get(row.id);
    if (!parentId) {
      roots.push(row.id);
      continue;
    }
    const list = childrenOf.get(parentId) ?? [];
    list.push(row.id);
    childrenOf.set(parentId, list);
  }

  const byId = new Map<string, PlaceNode>();
  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      label: placeLabel(row),
      value: placeLabel(row),
      kind: row.kind,
      children: [],
    });
  }

  const order = new Map(rows.map((r) => [r.id, r]));

  const attach = (ids: string[]): PlaceNode[] =>
    ids
      .map((id) => byId.get(id)!)
      .filter(Boolean)
      .sort((a, b) => {
        const ra = order.get(a.id)!;
        const rb = order.get(b.id)!;
        if (ra.sortOrder !== rb.sortOrder) return ra.sortOrder - rb.sortOrder;
        return a.label.localeCompare(b.label);
      })
      .map((node) => ({
        ...node,
        children: attach(childrenOf.get(node.id) ?? []),
      }));

  return attach(roots);
}

/**
 * Would linking `childId` to `parentId` close a cycle? Walks up from the
 * candidate parent and looks for the child.
 */
function createsCycle(
  rows: PlaceRow[],
  childId: string,
  parentId: string,
): boolean {
  const parentOf = new Map(rows.map((r) => [r.id, r.parentId]));
  const seen = new Set<string>();
  let current: string | null = parentId;

  while (current) {
    if (current === childId) return true;
    if (seen.has(current)) return true;
    seen.add(current);
    current = parentOf.get(current) ?? null;
  }

  return false;
}

/**
 * Keep only the places of the given kind, but keep their ancestors so the
 * groups stay intact.
 *
 * A node is kept when it matches the kind, or when it has a kept descendant.
 */
export function filterPlaceTree(
  nodes: PlaceNode[],
  kind: string | string[],
): PlaceNode[] {
  const kinds = Array.isArray(kind) ? kind : [kind];
  const out: PlaceNode[] = [];

  for (const node of nodes) {
    const children = filterPlaceTree(node.children, kinds);
    if (kinds.includes(node.kind) || children.length > 0) {
      out.push({ ...node, children });
    }
  }

  return out;
}

/**
 * Flatten the tree into rows with their depth — used by the admin table to
 * render the hierarchy indented.
 */
export function flattenPlaceTree(
  nodes: PlaceNode[],
  depth = 0,
): { node: PlaceNode; depth: number }[] {
  const out: { node: PlaceNode; depth: number }[] = [];
  for (const node of nodes) {
    out.push({ node, depth });
    out.push(...flattenPlaceTree(node.children, depth + 1));
  }
  return out;
}

/**
 * The ids of every place below `rootId` in the hierarchy.
 *
 * Used to reject a parent that would create a cycle: a place may never be
 * moved below one of its own descendants.
 */
export function descendantPlaceIds(
  rows: Pick<PlaceRow, "id" | "parentId">[],
  rootId: string,
): Set<string> {
  const childrenOf = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.parentId) continue;
    const list = childrenOf.get(row.parentId) ?? [];
    list.push(row.id);
    childrenOf.set(row.parentId, list);
  }

  const out = new Set<string>([rootId]);
  const queue = [...(childrenOf.get(rootId) ?? [])];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (out.has(id)) continue;
    out.add(id);
    queue.push(...(childrenOf.get(id) ?? []));
  }
  return out;
}

/**
 * Does the node — or one of its descendants — match the query?
 *
 * Used by the dropdowns to decide whether a parent group stays visible.
 */
export function placeMatches(node: PlaceNode, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (node.label.toLowerCase().includes(q)) return true;
  return node.children.some((child) => placeMatches(child, q));
}

/** Does the tree still hold a selectable option after filtering? */
export function hasPlaceMatch(nodes: PlaceNode[], query: string): boolean {
  return nodes.some((node) => placeMatches(node, query));
}
