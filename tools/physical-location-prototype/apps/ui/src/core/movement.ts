import type { Dataset, Movement } from './models';

export type MoveResult =
  | { ok: true; dataset: Dataset; movement: Movement }
  | { ok: false; error: string };

let sequence = 0;
function nextMovementId(): string {
  sequence += 1;
  return `mov-${Date.now()}-${sequence}`;
}

/**
 * Moves an item to `toLocationId` (or clears its location if `null`).
 * A `position`-type location is exclusive: at most one item may sit there
 * at a time. Non-position locations (drawers, cabinets, rooms) may hold
 * any number of items directly, matching the documented invariant that a
 * position holds at most one active item while other container types do
 * not need materialised slots.
 */
export function move(
  dataset: Dataset,
  itemId: string,
  toLocationId: string | null,
  occurredAt: string,
  note?: string,
  performedBy?: string,
): MoveResult {
  const item = dataset.items.find((candidate) => candidate.id === itemId);
  if (!item) {
    return { ok: false, error: `Unknown item id: ${itemId}` };
  }

  if (toLocationId) {
    const target = dataset.locations.find((location) => location.id === toLocationId);
    if (!target) {
      return { ok: false, error: `Unknown location id: ${toLocationId}` };
    }
    if (target.type === 'position') {
      const occupant = dataset.items.find(
        (candidate) => candidate.id !== itemId && candidate.locationId === toLocationId,
      );
      if (occupant) {
        return {
          ok: false,
          error: `Position ${target.name} is already occupied by ${occupant.catalogueNumber}`,
        };
      }
    }
  }

  const movement: Movement = {
    id: nextMovementId(),
    itemId,
    fromLocationId: item.locationId,
    toLocationId,
    occurredAt,
    note,
    performedBy,
  };

  const updatedItems = dataset.items.map((candidate) =>
    candidate.id === itemId ? { ...candidate, locationId: toLocationId } : candidate,
  );

  return {
    ok: true,
    dataset: { ...dataset, items: updatedItems, movements: [...dataset.movements, movement] },
    movement,
  };
}
