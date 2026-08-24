/**
 * Minimal domain model for the physical-location prototype.
 *
 * Deliberately smaller than the documented target domain model
 * (docs/architecture/domain-model.md): there is no separate `Position`
 * entity, no `ItemType`, no typed custom fields, no taxonomy. A position
 * inside a tray is modelled as a leaf `Location` of type `"position"`
 * whose `parentId` points at the tray. This is a throwaway simplification
 * for this experiment, not a proposal to simplify the real domain model.
 */

export type LocationType =
  | 'building'
  | 'room'
  | 'cabinet'
  | 'drawer'
  | 'box'
  | 'tray'
  | 'position';

export interface Location {
  id: string;
  parentId: string | null;
  name: string;
  type: LocationType;
  /** 1-based row/column, only meaningful for `type === 'position'`. */
  row?: number;
  column?: number;
  /**
   * Free-form 2D floor-plan coordinates, in arbitrary layout units. Only
   * meaningful for locations shown on a `FloorPlanComponent` map (currently
   * rooms within a building, and cabinets within a room) — every sibling at
   * that level has all four, or none do.
   */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export type ItemStatus = 'active' | 'checked_out' | 'lost' | 'archived';

export interface Item {
  id: string;
  catalogueNumber: string;
  label?: string;
  locationId: string | null;
  status: ItemStatus;
}

export interface Movement {
  id: string;
  itemId: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  occurredAt: string;
  note?: string;
}

export interface Dataset {
  locations: Location[];
  items: Item[];
  movements: Movement[];
}
