import type { LocationType } from '../../../core/models';

/** Visual wall height per location type, in the same arbitrary layout units as `x`/`y`/`width`/`height`. */
export const WALL_HEIGHT: Readonly<Partial<Record<LocationType, number>>> = {
  floor: 200,
  room: 140,
  cabinet: 90,
};

/** Wall height for any type without an explicit one (trays, drawers, …). */
export const DEFAULT_WALL_HEIGHT = 70;

/** Vertical gap between one floor's slab and the next, when stacking a building's floors. */
export const FLOOR_STACK_HEIGHT = 240;

/**
 * Floors don't occupy distinct footprints the way rooms within a floor do —
 * in the 2D map they are simply listed one below another as a layout
 * convenience (see `seed.ts`'s `FLOOR_LAYOUT`). In 3D that ordering instead
 * becomes vertical stacking, so every floor shares one footprint here and is
 * told apart only by its elevation.
 */
export const FLOOR_FOOTPRINT = { x: 0, y: 0, width: 480, height: 320 } as const;

/** Orbit/zoom limits. */
export const MIN_TILT = 20;
export const MAX_TILT = 85;
export const MIN_SCALE = 0.4;
export const MAX_SCALE = 2.2;

/** Pointer movement, in pixels, before a press-and-move counts as an orbit drag rather than a click on a box. */
export const DRAG_THRESHOLD = 4;

/**
 * The 'front' wall's outward-facing azimuth, in degrees within the box's own
 * footprint (arbitrary anchor; 'back' sits 180° opposite it) — used to decide
 * whether front or back currently faces the camera as the user orbits.
 */
export const FRONT_AZIMUTH = 270;

/** Nudge step for the explicit d-pad rotate controls, in degrees. */
export const ROTATE_STEP = 15;

/** Default initial orbit angles, in degrees. */
export const INITIAL_ROTATE_Z = -25;
export const DESKTOP_INITIAL_ROTATE_X = 55;
export const MOBILE_INITIAL_ROTATE_X = 45;

/** Compacted wall/slab heights used on small screens so a stack stays viewable. */
export const MOBILE_WALL_HEIGHT = 100;
export const MOBILE_STACK_HEIGHT = 120;
export const MOBILE_FOOTPRINT_DIVISOR = 480;

/** Scene-height fitting limits used by `fitScale` on mobile. */
export const MIN_MOBILE_SCENE_HEIGHT = 260;
export const MAX_MOBILE_SCENE_HEIGHT = 384;
export const MOBILE_SCENE_HEIGHT_RATIO = 0.8;
export const DESKTOP_SCENE_HEIGHT = 608;
export const SCENE_FIT_PADDING = 32;