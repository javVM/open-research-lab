import { Injectable } from '@angular/core';
import type { Location, LocationType } from '../../core/models';
import {
  COMPONENT_GAP,
  DEFAULT_COMPONENT_SIZE,
  FALLBACK_RECT_SIZE,
  FIRST_COMPONENT_POSITION,
  MAX_RENDER_SCALE,
  MIN_PREVIEW_SIZE,
  MIN_RENDER_SCALE,
  PREVIEW_INSET,
  VIEWPORT_PADDING,
} from './geometry.constants';

/**
 * Axis-aligned rectangle in the floor-plan's arbitrary layout units.
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Pure 2D geometry for the floor-plan map: sizing, positioning and the
 * hover-preview layout. Kept framework-light so both the flat map and any
 * other spatial view can share one source of truth instead of each embedding
 * the same arithmetic.
 */
@Injectable({ providedIn: 'root' })
export class GeometryService {
  /** The on-map rectangle for a location, scaled by the current render scale. */
  rectFor(location: Location, scale = 1): Rect {
    return {
      x: (location.x ?? 0) * scale,
      y: (location.y ?? 0) * scale,
      width: (location.width ?? FALLBACK_RECT_SIZE) * scale,
      height: (location.height ?? FALLBACK_RECT_SIZE) * scale,
    };
  }

  /** Smallest rectangle that contains every child plus the optional plan image. */
  bounds(
    items: readonly { x?: number; y?: number; width?: number; height?: number }[],
    imageSize?: { width?: number; height?: number } | undefined,
  ): Rect {
    const maxX = Math.max(
      imageSize?.width ?? 0,
      ...items.map((item) => (item.x ?? 0) + (item.width ?? 0)),
    );
    const maxY = Math.max(
      imageSize?.height ?? 0,
      ...items.map((item) => (item.y ?? 0) + (item.height ?? 0)),
    );
    return { x: 0, y: 0, width: maxX, height: maxY };
  }

  /**
   * Auto-fit scale so a wide map fits the viewport on small screens, clamped
   * to the render scale limits. Returns `1` for anything that already fits.
   */
  fitScale(rawWidth: number, viewportWidth: number): number {
    if (rawWidth <= 0) {
      return 1;
    }
    const fit = (viewportWidth - VIEWPORT_PADDING) / rawWidth;
    return Math.max(MIN_RENDER_SCALE, Math.min(MAX_RENDER_SCALE, fit));
  }

  /** Default footprint a freshly added component of `type` starts with. */
  defaultSizeFor(type: LocationType): { width: number; height: number } {
    return { ...DEFAULT_COMPONENT_SIZE[type] };
  }

  /**
   * Where a newly added component should go: stacked below the current bottom
   * sibling, or at the origin when nothing shares the container yet.
   */
  nextPosition(siblings: readonly Location[], size: { width: number; height: number }): { x: number; y: number } {
    if (siblings.length === 0) {
      return { ...FIRST_COMPONENT_POSITION };
    }
    const maxBottom = Math.max(...siblings.map((sibling) => (sibling.y ?? 0) + (sibling.height ?? 0)));
    return { x: 0, y: maxBottom + COMPONENT_GAP };
  }

  /** How many siblings of `type` already live directly inside `parentId`. */
  siblingCount(locations: readonly Location[], parentId: string, type: LocationType): number {
    return locations.filter(
      (candidate) => candidate.parentId === parentId && candidate.type === type,
    ).length;
  }

  /** The hover-preview overlay area inside `parentRect`, inset by a fixed margin. */
  previewArea(parentRect: Rect): Rect {
    return {
      x: PREVIEW_INSET,
      y: PREVIEW_INSET,
      width: Math.max(0, parentRect.width - PREVIEW_INSET * 2),
      height: Math.max(0, parentRect.height - PREVIEW_INSET * 2),
    };
  }

  /**
   * The rect a single `child` occupies within a `previewArea`, by scaling the
   * child's own coordinates down to fit `siblings`' shared bounding box.
   */
  previewRectFor(area: Rect, siblings: readonly Location[], child: Location): Rect {
    const boundsWidth = Math.max(1, ...siblings.map((sibling) => (sibling.x ?? 0) + (sibling.width ?? 0)));
    const boundsHeight = Math.max(1, ...siblings.map((sibling) => (sibling.y ?? 0) + (sibling.height ?? 0)));
    const scale = Math.min(area.width / boundsWidth, area.height / boundsHeight);
    return {
      x: area.x + (child.x ?? 0) * scale,
      y: area.y + (child.y ?? 0) * scale,
      width: Math.max(MIN_PREVIEW_SIZE, (child.width ?? 0) * scale),
      height: Math.max(MIN_PREVIEW_SIZE, (child.height ?? 0) * scale),
    };
  }
}