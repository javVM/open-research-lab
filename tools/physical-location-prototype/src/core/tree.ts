import type { Location } from './models';

export interface LocationNode {
  location: Location;
  children: LocationNode[];
}

export function childrenOf(locations: Location[], parentId: string | null): Location[] {
  return locations
    .filter((location) => location.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

/**
 * Groups `locations` by `parentId` in a single pass, sorting each group
 * once. Used by `buildTree` so building the whole tree is O(n log n)
 * instead of re-filtering the full array at every node (which is O(n) per
 * node, i.e. O(n^2) overall for a tree with n locations).
 */
function groupByParent(locations: Location[]): Map<string | null, Location[]> {
  const groups = new Map<string | null, Location[]>();
  for (const location of locations) {
    const siblings = groups.get(location.parentId);
    if (siblings) {
      siblings.push(location);
    } else {
      groups.set(location.parentId, [location]);
    }
  }
  for (const siblings of groups.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }
  return groups;
}

function buildFromIndex(groups: Map<string | null, Location[]>, parentId: string | null): LocationNode[] {
  const children = groups.get(parentId) ?? [];
  return children.map((location) => ({
    location,
    children: buildFromIndex(groups, location.id),
  }));
}

export function buildTree(locations: Location[], parentId: string | null = null): LocationNode[] {
  return buildFromIndex(groupByParent(locations), parentId);
}

/**
 * Path from the root ancestor down to (and including) `locationId`.
 * Throws if the id is unknown or the parent chain is broken, since that
 * indicates corrupt fixture data rather than a recoverable state.
 */
export function breadcrumb(locations: Location[], locationId: string): Location[] {
  const byId = new Map(locations.map((location) => [location.id, location]));
  const path: Location[] = [];
  let current = byId.get(locationId);
  if (!current) {
    throw new Error(`Unknown location id: ${locationId}`);
  }
  while (current) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

export function breadcrumbLabel(locations: Location[], locationId: string): string {
  return breadcrumb(locations, locationId)
    .map((location) => location.name)
    .join(' / ');
}

/** Ids of every ancestor of `locationId`, root first, excluding `locationId` itself. */
export function ancestorIds(locations: Location[], locationId: string): string[] {
  return breadcrumb(locations, locationId)
    .slice(0, -1)
    .map((location) => location.id);
}

export function descendantIds(locations: Location[], locationId: string): string[] {
  const direct = childrenOf(locations, locationId);
  return direct.flatMap((child) => [child.id, ...descendantIds(locations, child.id)]);
}
