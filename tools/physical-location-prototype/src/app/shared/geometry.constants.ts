import type { LocationType } from '../../core/models';

/** Default footprint a freshly added mappable component starts with, per type. */
export const DEFAULT_COMPONENT_SIZE: Readonly<Record<LocationType, { width: number; height: number }>> = {
  floor: { width: 600, height: 400 },
  room: { width: 184, height: 184 },
  cabinet: { width: 84, height: 164 },
  building: { width: 100, height: 80 },
  drawer: { width: 100, height: 80 },
  box: { width: 100, height: 80 },
  tray: { width: 100, height: 80 },
  position: { width: 100, height: 80 },
};

/** Fallback size used when a location lacks explicit coordinates. */
export const FALLBACK_RECT_SIZE = 100;

/** Smallest a rect may be dragged/resized to (in layout units). */
export const MIN_COMPONENT_SIZE = 32;

/** Vertical gap between a newly added component and the one above it. */
export const COMPONENT_GAP = 16;

/** Gap between the map's content and the viewport edge when auto-fitting on small screens. */
export const VIEWPORT_PADDING = 16;

/** Clamp for the auto-fit scale. Allows zooming small rooms to fill the viewport. */
export const MIN_RENDER_SCALE = 0.25;
export const MAX_RENDER_SCALE = 3;

/** Inset of a hover preview overlay inside its parent rect. */
export const PREVIEW_INSET = 4;

/** Minimum size of a previewed child so it stays visible when scaled down heavily. */
export const MIN_PREVIEW_SIZE = 3;

/** Position of a newly added component before any siblings exist. */
export const FIRST_COMPONENT_POSITION = { x: 0, y: 0 } as const;