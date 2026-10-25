import { Injectable } from '@angular/core';
import { clamp01, OCCUPANCY_PALETTE } from './palette.constants';

/**
 * Shared "painting" helpers for spatial views. Everything that turns an
 * occupancy figure into a visual (currently a background colour) lives here so
 * the 2D map and the 3D view cannot drift apart.
 */
@Injectable({ providedIn: 'root' })
export class RenderService {
  /**
   * Heat colour for a container holding `count` items among `maxCount` across
   * its siblings. `baseAlpha` is the empty-colour intensity for the current
   * view; `boost` applies a per-surface shading tweak.
   */
  occupancyColor(count: number, maxCount: number, baseAlpha: number, boost = 0): string {
    const max = Math.max(1, maxCount);
    const ratio = count / max;
    const alpha = clamp01(baseAlpha + ratio * OCCUPANCY_PALETTE.ratioAlphaStep + boost);
    return `rgba(${OCCUPANCY_PALETTE.rgb}, ${alpha.toFixed(2)})`;
  }
}