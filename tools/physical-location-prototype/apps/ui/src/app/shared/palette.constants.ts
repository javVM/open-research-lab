/**
 * Occupancy heat-map palette. Rect/surface background intensity reflects how
 * full a container is relative to its busiest sibling. All values are tuned
 * together here so a change reads as one edit rather than edits scattered
 * across the 2D map and the 3D view.
 */
export const OCCUPANCY_PALETTE = {
  /** The base RGB triple of the heat colour, without an alpha channel. */
  rgb: '91, 141, 239',
  /** Minimum alpha (an empty container), 2D map. */
  mapBaseAlpha: 0.12,
  /** Minimum alpha (an empty container), 3D view. */
  map3dBaseAlpha: 0.18,
  /** How much alpha rises as the container approaches the busiest sibling. */
  ratioAlphaStep: 0.55,
  /** Per-face shading tweaks applied on top of occupancy, 3D view. */
  faceTopBoost: 0.15,
  faceFrontBoost: -0.08,
  faceBackBoost: -0.14,
  faceLeftBoost: -0.11,
  faceRightBoost: -0.05,
} as const;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}