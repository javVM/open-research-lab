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
  | 'floor'
  | 'room'
  | 'cabinet'
  | 'drawer'
  | 'box'
  | 'tray'
  | 'position';

/** A point in 2D space, in a location's local layout coordinates. */
export interface Point {
  x: number;
  y: number;
}

export type StorageCondition =
  | 'ambient_room'
  | 'refrigerated'
  | 'frozen'
  | 'ultra_low_freezer'
  | 'cryogenic'
  | 'flammable'
  | 'corrosive'
  | 'toxic_biomaterial'
  | 'radioactive'
  | 'dry_storage'
  | 'fluid_storage'
  | 'vacuum_sealed'
  | 'paleontology'
  | 'geology'
  | 'botany'
  | 'zoology'
  | 'historical_archive';

export interface Location {
  id: string;
  parentId: string | null;
  name: string;
  type: LocationType;
  /** Storage/museo conditions; array para hijos — vacío = hereda del padre, root vacío = ambient_room */
  storageConditions?: StorageCondition[];
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
  /**
   * Optional orthogonal (all-90°-angles) polygon outline, in the location's
   * local coordinates (0..width, 0..height). When absent the location is a
   * plain rectangle. The list is a closed, clockwise vertex sequence; see
   * `core/outline.ts`. Only meaningful for mappable locations.
   */
  outline?: readonly Point[];
  /**
   * A user-supplied floor-plan image (data URL, so it round-trips through
   * the local-first `localStorage` snapshot with no network calls) used as
   * the background of a `FloorPlanComponent` map when this location's own
   * children are being shown on it — e.g. a scanned building blueprint
   * behind its floors. `width`/`height` are the image's natural pixel size,
   * used to size the map canvas; the image is not calibrated to a real
   * physical scale, it is purely a visual backdrop that children's existing
   * `x`/`y`/`width`/`height` get dragged onto.
   */
  mapImage?: { dataUrl: string; width: number; height: number };
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
