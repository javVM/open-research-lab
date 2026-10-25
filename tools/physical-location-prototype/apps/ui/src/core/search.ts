import type { Dataset, Item, Location, Movement } from './models';
import { breadcrumb } from './tree';

export interface WhereIsResult {
  item: Item;
  breadcrumb: Location[];
}

/** Where is this item right now? Undefined if it has no recorded location. */
export function whereIs(dataset: Dataset, itemId: string): WhereIsResult | undefined {
  const item = dataset.items.find((candidate) => candidate.id === itemId);
  if (!item || !item.locationId) {
    return undefined;
  }
  return { item, breadcrumb: breadcrumb(dataset.locations, item.locationId) };
}

export function itemsAtLocation(dataset: Dataset, locationId: string): Item[] {
  return dataset.items.filter((item) => item.locationId === locationId);
}

/** Item count at `locationId` plus everywhere underneath it in the tree. */
export function itemCountIncludingDescendants(dataset: Dataset, locationId: string): number {
  const direct = itemsAtLocation(dataset, locationId).length;
  const children = dataset.locations.filter((location) => location.parentId === locationId);
  return (
    direct +
    children.reduce((sum, child) => sum + itemCountIncludingDescendants(dataset, child.id), 0)
  );
}

/**
 * Computes the "items here and below" count for every location at once, in
 * a single O(n) pass (direct counts, then one bottom-up accumulation using
 * a parent index) rather than calling `itemCountIncludingDescendants` per
 * location, which re-walks the whole tree from scratch each time and is
 * O(n) per call — O(n * m) for m locations. Prefer this whenever counts are
 * needed for more than one location at a time, e.g. rendering a tree or a
 * grid of container cards.
 */
export function itemCountsByLocation(dataset: Dataset): Map<string, number> {
  const counts = new Map<string, number>();
  for (const location of dataset.locations) {
    counts.set(location.id, 0);
  }
  for (const item of dataset.items) {
    if (item.locationId && counts.has(item.locationId)) {
      counts.set(item.locationId, (counts.get(item.locationId) ?? 0) + 1);
    }
  }

  const childrenByParent = new Map<string, Location[]>();
  for (const location of dataset.locations) {
    if (location.parentId) {
      const siblings = childrenByParent.get(location.parentId);
      if (siblings) {
        siblings.push(location);
      } else {
        childrenByParent.set(location.parentId, [location]);
      }
    }
  }

  const roots = dataset.locations.filter((location) => location.parentId === null);
  function accumulate(location: Location): number {
    const children = childrenByParent.get(location.id) ?? [];
    const total = (counts.get(location.id) ?? 0) + children.reduce((sum, child) => sum + accumulate(child), 0);
    counts.set(location.id, total);
    return total;
  }
  for (const root of roots) {
    accumulate(root);
  }

  return counts;
}

/** What has happened to this item? Oldest first. */
export function historyOf(dataset: Dataset, itemId: string): Movement[] {
  return dataset.movements
    .filter((movement) => movement.itemId === itemId)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

export function searchItems(dataset: Dataset, query: string): Item[] {
  const normalised = query.trim().toLowerCase();
  if (!normalised) {
    return [];
  }
  return dataset.items.filter(
    (item) =>
      item.catalogueNumber.toLowerCase().includes(normalised) ||
      (item.label ?? '').toLowerCase().includes(normalised),
  );
}
