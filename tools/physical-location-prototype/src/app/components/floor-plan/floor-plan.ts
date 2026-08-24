import { Component, Input, computed, inject } from '@angular/core';
import type { Location } from '../../../core/models';
import { DataService } from '../../data.service';
import { TranslationService } from '../../i18n/translation.service';
import { createLocationTypeTranslations } from '../../shared/location-type.translations';
import { createFloorPlanTranslations } from './floor-plan.translations';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragState {
  locationId: string;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  moved: boolean;
}

interface ResizeState {
  locationId: string;
  startClientX: number;
  startClientY: number;
  startWidth: number;
  startHeight: number;
}

const MIN_SIZE = 60;

/**
 * A free-form 2D map of `locations`, each positioned at its own `x`/`y` and
 * sized by its own `width`/`height` (in arbitrary layout units, treated as
 * pixels here). Every location passed in must have all four set — the
 * caller (`LocationViewComponent`) only renders this when that holds for
 * the whole set of children, e.g. rooms within a building.
 */
@Component({
  selector: 'app-floor-plan',
  imports: [],
  templateUrl: './floor-plan.html',
  styleUrl: './floor-plan.css',
})
export class FloorPlanComponent {
  @Input() locations: Location[] = [];

  protected readonly data = inject(DataService);
  protected readonly text = createFloorPlanTranslations(inject(TranslationService));
  protected readonly locationType = createLocationTypeTranslations(inject(TranslationService));

  private dragState: DragState | null = null;
  private suppressNextClick = false;

  /**
   * A plain method, not `computed()`: `locations` is a regular `@Input`,
   * not a signal, so a `computed()` reading it would memoize after its
   * first call and never notice later `@Input` changes (e.g. after a drag
   * or resize moves the bounding box) — it would just go stale.
   */
  bounds(): Rect {
    if (this.locations.length === 0) {
      return { x: 0, y: 0, width: 1, height: 1 };
    }
    const maxX = Math.max(...this.locations.map((location) => (location.x ?? 0) + (location.width ?? 0)));
    const maxY = Math.max(...this.locations.map((location) => (location.y ?? 0) + (location.height ?? 0)));
    return { x: 0, y: 0, width: maxX, height: maxY };
  }

  rectFor(location: Location): Rect {
    return {
      x: location.x ?? 0,
      y: location.y ?? 0,
      width: location.width ?? 100,
      height: location.height ?? 100,
    };
  }

  countAt(locationId: string): number {
    return this.data.locationItemCounts().get(locationId) ?? 0;
  }

  /** Background colour intensity relative to the busiest location currently shown, for an at-a-glance occupancy read. */
  occupancyBackground(locationId: string): string {
    const max = Math.max(1, ...this.locations.map((location) => this.countAt(location.id)));
    const ratio = this.countAt(locationId) / max;
    const alpha = 0.12 + ratio * 0.55;
    return `rgba(91, 141, 239, ${alpha.toFixed(2)})`;
  }

  isDropTarget(): boolean {
    return Boolean(this.data.movingItemId());
  }

  /**
   * Direct children of `location` that themselves have floor-plan
   * coordinates (e.g. cabinets within a room, while viewing the room's
   * building). Shown as a small scaled-down inset so the map gives some
   * sense of what's inside a container without navigating into it.
   */
  previewChildren(location: Location): Location[] {
    return this.data
      .dataset()
      .locations.filter((candidate) => candidate.parentId === location.id && typeof candidate.x === 'number');
  }

  /** Reserves the bottom portion of `location`'s own rect for the preview inset. */
  previewArea(location: Location): Rect {
    const parentRect = this.rectFor(location);
    const inset = 6;
    const height = Math.max(0, Math.min(parentRect.height * 0.42, parentRect.height - 36));
    return {
      x: inset,
      y: parentRect.height - height - inset,
      width: Math.max(0, parentRect.width - inset * 2),
      height,
    };
  }

  previewRectFor(location: Location, child: Location): Rect {
    const area = this.previewArea(location);
    const siblings = this.previewChildren(location);
    const boundsWidth = Math.max(1, ...siblings.map((s) => (s.x ?? 0) + (s.width ?? 0)));
    const boundsHeight = Math.max(1, ...siblings.map((s) => (s.y ?? 0) + (s.height ?? 0)));
    const scale = Math.min(area.width / boundsWidth, area.height / boundsHeight);
    return {
      x: area.x + (child.x ?? 0) * scale,
      y: area.y + (child.y ?? 0) * scale,
      width: Math.max(3, (child.width ?? 0) * scale),
      height: Math.max(3, (child.height ?? 0) * scale),
    };
  }

  onClick(locationId: string): void {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }
    if (this.data.movingItemId()) {
      this.data.requestMove(locationId);
      return;
    }
    this.data.selectLocation(locationId);
  }

  onPointerDown(event: PointerEvent, location: Location): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    this.dragState = {
      locationId: location.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: location.x ?? 0,
      startY: location.y ?? 0,
      moved: false,
    };
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const state = this.dragState;
    if (!state) {
      return;
    }
    const dx = event.clientX - state.startClientX;
    const dy = event.clientY - state.startClientY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      state.moved = true;
    }
    const nextX = Math.max(0, Math.round(state.startX + dx));
    const nextY = Math.max(0, Math.round(state.startY + dy));
    this.data.updateLocationPosition(state.locationId, nextX, nextY);
  };

  private readonly onPointerUp = (): void => {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    if (this.dragState?.moved) {
      this.suppressNextClick = true;
    }
    this.dragState = null;
  };

  private resizeState: ResizeState | null = null;

  onResizePointerDown(event: PointerEvent, location: Location): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const rect = this.rectFor(location);
    this.resizeState = {
      locationId: location.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
    };
    window.addEventListener('pointermove', this.onResizePointerMove);
    window.addEventListener('pointerup', this.onResizePointerUp);
  }

  private readonly onResizePointerMove = (event: PointerEvent): void => {
    const state = this.resizeState;
    if (!state) {
      return;
    }
    const dx = event.clientX - state.startClientX;
    const dy = event.clientY - state.startClientY;
    const nextWidth = Math.max(MIN_SIZE, Math.round(state.startWidth + dx));
    const nextHeight = Math.max(MIN_SIZE, Math.round(state.startHeight + dy));
    this.data.updateLocationSize(state.locationId, nextWidth, nextHeight);
  };

  private readonly onResizePointerUp = (): void => {
    window.removeEventListener('pointermove', this.onResizePointerMove);
    window.removeEventListener('pointerup', this.onResizePointerUp);
    this.resizeState = null;
  };
}
