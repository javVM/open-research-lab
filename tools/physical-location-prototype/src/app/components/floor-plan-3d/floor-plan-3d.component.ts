import { NgTemplateOutlet } from '@angular/common';
import { Component, Input, inject, signal } from '@angular/core';
import type { Location } from '../../../core/models';
import { DataService } from '../../data.service';
import { TranslationService } from '../../i18n/translation.service';
import { createFloorPlan3dTranslations } from './floor-plan-3d.translations';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OrbitState {
  startClientX: number;
  startClientY: number;
  startRotateZ: number;
  startRotateX: number;
}

/** Visual wall height per location type, in the same arbitrary layout units as `x`/`y`/`width`/`height`. */
const WALL_HEIGHT: Partial<Record<Location['type'], number>> = {
  floor: 200,
  room: 140,
  cabinet: 90,
};
const DEFAULT_WALL_HEIGHT = 70;

/** Vertical gap between one floor's slab and the next, when stacking a building's floors. */
const FLOOR_STACK_HEIGHT = 240;

/**
 * Floors don't occupy distinct footprints the way rooms within a floor do —
 * in the 2D map they are simply listed one below another as a layout
 * convenience (see `seed.ts`'s `FLOOR_LAYOUT`). In 3D that ordering instead
 * becomes vertical stacking, so every floor shares one footprint here and is
 * told apart only by `elevationFor`.
 */
const FLOOR_FOOTPRINT: Rect = { x: 0, y: 0, width: 480, height: 320 };

const MIN_TILT = 20;
const MAX_TILT = 85;
const MIN_SCALE = 0.4;
const MAX_SCALE = 2.2;

/** Pointer movement, in pixels, before a press-and-move counts as an orbit drag rather than a click on a box. */
const DRAG_THRESHOLD = 4;

/**
 * The 'front' wall's outward-facing azimuth, in degrees within the box's own
 * footprint (arbitrary anchor; 'back' sits 180° opposite it) — used by
 * `facingSide()` to decide whether front or back currently faces the
 * camera as the user orbits.
 */
const FRONT_AZIMUTH = 270;

/**
 * A read-only, orbitable 3D extrusion of the same `locations` a
 * `FloorPlanComponent` would show flat — same `x`/`y`/`width`/`height` data,
 * rendered as CSS boxes with a per-type wall height instead of flat
 * rectangles. Dragging or resizing stays the 2D map's job; this view is for
 * getting a sense of the space, and for stacked floors within a building.
 */
@Component({
  selector: 'app-floor-plan-3d',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './floor-plan-3d.component.html',
  styleUrl: './floor-plan-3d.component.scss',
})
export class FloorPlan3dComponent {
  @Input() locations: Location[] = [];

  protected readonly data = inject(DataService);
  protected readonly text = createFloorPlan3dTranslations(inject(TranslationService));

  constructor() {
    if (this.isMobile()) {
      this.scale.set(0.65);
      this.rotateXDeg.set(45);
    }
  }

  private isMobile(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 767px)').matches
    );
  }

  /**
   * Orbit/zoom state, read from the template's `planeTransform()` call.
   * These must be signals, not plain fields: they are mutated from
   * `window.addEventListener` callbacks entirely outside Angular's own
   * listener wrapping, and this app runs zoneless change detection — see
   * the identical reasoning on `FloorPlanComponent.interactingLocationId`.
   */
  private readonly rotateZDeg = signal(-25);
  private readonly rotateXDeg = signal(55);
  private readonly scale = signal(1);

  private orbitState: OrbitState | null = null;
  private didDragSignificantly = false;
  private pinchStartDistance: number | null = null;
  private pinchStartScale = 1;

  planeTransform(): string {
    return `scale(${this.scale()}) rotateX(${this.rotateXDeg()}deg) rotateZ(${this.rotateZDeg()}deg)`;
  }

  /** Nudges the orbit by a fixed step — an explicit alternative to drag-to-orbit. */
  rotate(direction: 'up' | 'down' | 'left' | 'right'): void {
    const STEP = 15;
    if (direction === 'up') {
      this.rotateXDeg.set(Math.min(MAX_TILT, this.rotateXDeg() + STEP));
    } else if (direction === 'down') {
      this.rotateXDeg.set(Math.max(MIN_TILT, this.rotateXDeg() - STEP));
    } else if (direction === 'left') {
      this.rotateZDeg.set(this.rotateZDeg() - STEP);
    } else {
      this.rotateZDeg.set(this.rotateZDeg() + STEP);
    }
  }

  /** Same idea as `FloorPlanComponent.bounds()` — the plane must be big enough for every child's footprint. */
  bounds(): Rect {
    if (this.locations.length === 0) {
      return { x: 0, y: 0, width: FLOOR_FOOTPRINT.width, height: FLOOR_FOOTPRINT.height };
    }
    const rects = this.locations.map((location) => this.rectFor(location));
    const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
    const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));
    return { x: 0, y: 0, width: maxX, height: maxY };
  }

  resetView(): void {
    this.rotateZDeg.set(-25);
    this.rotateXDeg.set(this.isMobile() ? 45 : 55);
    this.scale.set(this.isMobile() ? 0.65 : 1);
  }

  rectFor(location: Location): Rect {
    if (location.type === 'floor') {
      return FLOOR_FOOTPRINT;
    }
    return {
      x: location.x ?? 0,
      y: location.y ?? 0,
      width: location.width ?? 100,
      height: location.height ?? 100,
    };
  }

  wallHeight(location: Location): number {
    if (location.type === 'floor' && this.isMobile()) {
      return 100;
    }
    return WALL_HEIGHT[location.type] ?? DEFAULT_WALL_HEIGHT;
  }

  /** Floors stack by their existing 2D `y` order; every other type sits flat on its own level. */
  elevationFor(location: Location): number {
    if (location.type !== 'floor') {
      return 0;
    }
    const stackHeight = this.isMobile() ? 120 : FLOOR_STACK_HEIGHT;
    return this.floorIndex(location) * stackHeight;
  }

  /** A floor's position among its building's floors, ordered by the existing 2D `y` (see `seed.ts`'s `FLOOR_LAYOUT`). */
  private floorIndex(location: Location): number {
    const floors = this.locations.filter((candidate) => candidate.type === 'floor');
    const sorted = [...floors].sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
    return sorted.findIndex((candidate) => candidate.id === location.id);
  }

  countAt(locationId: string): number {
    return this.data.locationItemCounts().get(locationId) ?? 0;
  }

  /** `siblings` sets the occupancy scale — the busiest of them gets the strongest colour. */
  occupancyColor(locationId: string, siblings: Location[], alphaBoost = 0): string {
    const max = Math.max(1, ...siblings.map((sibling) => this.countAt(sibling.id)));
    const ratio = this.countAt(locationId) / max;
    const alpha = 0.18 + ratio * 0.55 + alphaBoost;
    return `rgba(91, 141, 239, ${Math.min(1, alpha).toFixed(2)})`;
  }

  /**
   * Whether 'front' or 'back' currently faces the camera, so the
   * drawer/shelf overlay (see `uncoordinatedChildren`) migrates to stay
   * visible as the user orbits. Deliberately never 'left'/'right': a real
   * cabinet's drawers always open from the same physical side, never from
   * its sides, so the overlay should only ever toggle between the two ends
   * a drawer front could plausibly be on.
   */
  facingSide(): 'front' | 'back' {
    const cameraAzimuth = ((-this.rotateZDeg() % 360) + 360) % 360;
    const rawDiff = Math.abs(cameraAzimuth - FRONT_AZIMUTH);
    const diffToFront = Math.min(rawDiff, 360 - rawDiff);
    // The wall whose azimuth is closest to the camera's is the *far* one
    // (the one the camera looks across the box to see) — the near, visible
    // wall is the opposite one.
    return diffToFront <= 90 ? 'back' : 'front';
  }

  /**
   * Direct children with no floor-plan coordinates of their own (e.g. a
   * cabinet's drawers) can't be drawn as separately positioned boxes — shown
   * instead as evenly spaced shelf bands across whichever wall currently
   * faces the camera (see `facingSide`), so a cabinet's drawers are still
   * visible even though `seed.ts` never gives drawers an
   * `x`/`y`/`width`/`height`.
   */
  uncoordinatedChildren(location: Location): Location[] {
    return this.data
      .dataset()
      .locations.filter((candidate) => candidate.parentId === location.id && typeof candidate.x !== 'number');
  }

  /**
   * Every face is a flat `left:0; top:0` rectangle rotated around its own
   * centre and then shifted into place with `translate3d`, rather than
   * hinged from an edge — hinging from an edge only produces a correctly
   * placed wall if the pre-rotation offset exactly cancels out, which is
   * easy to get subtly wrong (and was: it previously produced walls
   * floating away from the box, giving the crossed/open look). Rotating
   * around the centre first means the rotation never moves that centre
   * point, so the required corrective translation is a fixed, simple
   * function of the wall's own half-thickness — see the derivation in the
   * PR/commit message, not repeated here per line.
   */
  sideTransform(location: Location, side: 'front' | 'back' | 'left' | 'right'): string {
    const rect = this.rectFor(location);
    const wallHeight = this.wallHeight(location);
    const half = wallHeight / 2;
    switch (side) {
      case 'back':
        return `translate3d(0px, ${rect.height - half}px, ${half}px) rotateX(90deg)`;
      case 'front':
        return `translate3d(0px, ${-half}px, ${half}px) rotateX(-90deg)`;
      case 'left':
        return `translate3d(${-half}px, 0px, ${half}px) rotateY(90deg)`;
      case 'right':
        return `translate3d(${rect.width - half}px, 0px, ${half}px) rotateY(-90deg)`;
    }
  }

  onClick(locationId: string): void {
    // A drag that happened to start on top of a box (which now covers most
    // of the scene) still needs to orbit rather than select — suppress the
    // click that follows pointerup once the drag has moved past the
    // threshold, see `onOrbitPointerMove`.
    if (this.didDragSignificantly) {
      return;
    }
    if (this.data.movingItemId()) {
      this.data.requestMove(locationId);
      return;
    }
    this.data.selectLocation(locationId);
  }

  onOrbitPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.orbitState) {
      return;
    }
    this.didDragSignificantly = false;
    event.preventDefault();
    this.orbitState = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startRotateZ: this.rotateZDeg(),
      startRotateX: this.rotateXDeg(),
    };
    window.addEventListener('pointermove', this.onOrbitPointerMove);
    window.addEventListener('pointerup', this.onOrbitPointerUp);
  }

  private readonly onOrbitPointerMove = (event: PointerEvent): void => {
    if (this.pinchStartDistance !== null) {
      return;
    }
    const state = this.orbitState;
    if (!state) {
      return;
    }
    const dx = event.clientX - state.startClientX;
    const dy = event.clientY - state.startClientY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      this.didDragSignificantly = true;
    }
    this.rotateZDeg.set(state.startRotateZ + dx * 0.3);
    this.rotateXDeg.set(Math.min(MAX_TILT, Math.max(MIN_TILT, state.startRotateX - dy * 0.3)));
  };

  private readonly onOrbitPointerUp = (): void => {
    window.removeEventListener('pointermove', this.onOrbitPointerMove);
    window.removeEventListener('pointerup', this.onOrbitPointerUp);
    this.orbitState = null;
  };

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 2) {
      const [t1, t2] = [event.touches[0], event.touches[1]];
      this.pinchStartDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      this.pinchStartScale = this.scale();
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 2 && this.pinchStartDistance !== null) {
      const [t1, t2] = [event.touches[0], event.touches[1]];
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const next = this.pinchStartScale * (distance / this.pinchStartDistance);
      this.scale.set(Math.min(MAX_SCALE, Math.max(MIN_SCALE, next)));
    }
  }

  onTouchEnd(): void {
    this.pinchStartDistance = null;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.scale.set(Math.min(MAX_SCALE, Math.max(MIN_SCALE, this.scale() * (1 - event.deltaY * 0.001))));
  }
}
