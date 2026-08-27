import type { LocationType } from '../../core/models';

/**
 * The child location types each container may hold, mirroring the domain
 * hierarchy (building → … → position). Shared by every view that offers to
 * add a component, so the rules live in exactly one place.
 */
export const PARENT_CHILD_TYPES: Readonly<Record<LocationType, readonly LocationType[]>> = {
  building: ['floor'],
  floor: ['room'],
  room: ['cabinet'],
  cabinet: ['drawer'],
  drawer: ['box', 'tray'],
  box: ['tray'],
  tray: [],
  position: [],
};

/**
 * Location types whose children are drawn on a floor-plan map with their own
 * `x`/`y`/`width`/`height`. Everything else (e.g. a drawer's trays) is shown
 * as a flat list or a position grid instead.
 */
export const MAPPABLE_TYPES: readonly LocationType[] = ['floor', 'room', 'cabinet'];

/**
 * Location types that can hold an item directly, rather than only containing
 * deeper containers.
 */
export const ITEM_HOLDING_TYPES: readonly LocationType[] = ['drawer', 'box', 'tray', 'position'];

/** Convenience accessor: the single child type a container takes, if any. */
export function defaultChildType(containerType: LocationType): LocationType | null {
  return PARENT_CHILD_TYPES[containerType][0] ?? null;
}