import type { Container, Ulid } from './model.js';

/**
 * Pure container-tree operations. No state, no I/O: every function takes a
 * lookup so it can be tested and reused against any read model.
 */

export interface ContainerLookup {
  get(id: Ulid): Container | undefined;
}

/** Ordered ancestor ids from the immediate parent up to (but excluding) the root. */
export function ancestorIds(id: Ulid, lookup: ContainerLookup): Ulid[] {
  const ancestors: Ulid[] = [];
  const seen = new Set<Ulid>([id]);
  let current = lookup.get(id)?.parentId ?? null;
  while (current !== null) {
    if (seen.has(current)) {
      throw new Error(`cycle detected in container tree at ${current}`);
    }
    ancestors.push(current);
    seen.add(current);
    current = lookup.get(current)?.parentId ?? null;
  }
  return ancestors;
}

/** True if `candidateAncestor` is `id` itself or one of its ancestors. */
export function isAncestorOrSelf(candidateAncestor: Ulid, id: Ulid, lookup: ContainerLookup): boolean {
  if (candidateAncestor === id) {
    return true;
  }
  return ancestorIds(id, lookup).includes(candidateAncestor);
}

/** True if moving `containerId` under `newParentId` would create a cycle. */
export function wouldCreateCycle(
  containerId: Ulid,
  newParentId: Ulid,
  lookup: ContainerLookup,
): boolean {
  return isAncestorOrSelf(containerId, newParentId, lookup);
}

/** Ordered containers from the root down to `id` (inclusive). */
export function pathTo(id: Ulid, lookup: ContainerLookup): Container[] {
  const ordered: Container[] = [];
  for (const ancestorId of [...ancestorIds(id, lookup)].reverse()) {
    const container = lookup.get(ancestorId);
    if (container) {
      ordered.push(container);
    }
  }
  const self = lookup.get(id);
  if (self) {
    ordered.push(self);
  }
  return ordered;
}

/** Human-readable full path, e.g. `Lab A / Freezer 1 / Box 7`. */
export function fullPathLabel(id: Ulid, lookup: ContainerLookup, separator = ' / '): string {
  return pathTo(id, lookup)
    .map((container) => container.name)
    .join(separator);
}
