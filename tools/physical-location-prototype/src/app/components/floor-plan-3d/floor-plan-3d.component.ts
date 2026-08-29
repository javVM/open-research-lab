import { Component, ElementRef, effect, inject, input, signal, untracked, type OnDestroy } from '@angular/core';
import type { Location, Point } from '../../../core/models';
import { labelAnchor as polygonLabelAnchor, scaleOutline } from '../../../core/outline';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import { ViewportService } from '../../shared/viewport.service';
import { TranslationService } from '../../i18n/translation.service';
import { GeometryService, type Rect } from '../../shared/geometry.service';
import { RenderService } from '../../shared/render.service';
import { OCCUPANCY_PALETTE } from '../../shared/palette.constants';
import {
  DEFAULT_WALL_HEIGHT,
  DESKTOP_INITIAL_ROTATE_X,
  DESKTOP_SCENE_HEIGHT,
  DESKTOP_SCENE_WIDTH,
  DRAG_THRESHOLD,
  FLOOR_FOOTPRINT,
  FLOOR_STACK_HEIGHT,
  FRONT_AZIMUTH,
  INITIAL_ROTATE_Z,
  MAX_SCALE,
  MAX_TILT,
  MIN_SCALE,
  MIN_TILT,
  MOBILE_INITIAL_ROTATE_X,
  MOBILE_SCENE_HEIGHT_RATIO,
  MOBILE_STACK_HEIGHT,
  MOBILE_WALL_HEIGHT,
  ROTATE_STEP,
  SCENE_FIT_PADDING,
  WALL_HEIGHT,
} from './floor-plan-3d.geometry.constants';
import { createFloorPlan3dTranslations } from './floor-plan-3d.translations';

interface OrbitState {
  startClientX: number;
  startClientY: number;
  startRotateZ: number;
  startRotateX: number;
}

/** A single vertical wall face of a shaped (non-rectangular) location. */
interface WallFace {
  width: number;
  height: number;
  transform: string;
}

/**
 * A read-only, orbitable 3D extrusion of the same `locations` a
 * `FloorPlanComponent` would show flat — same `x`/`y`/`width`/`height` data,
 * rendered as CSS boxes with a per-type wall height instead of flat
 * rectangles. Dragging or resizing stays the 2D map's job; this view is for
 * getting a sense of the space, and for stacked floors within a building.
 * Dimensions come from `GeometryService`/its 3D constants and colours from
 * `RenderService`.
 */
@Component({
  selector: 'app-floor-plan-3d',
  standalone: true,
  imports: [],
  templateUrl: './floor-plan-3d.component.html',
  styleUrl: './floor-plan-3d.component.scss',
})
export class FloorPlan3dComponent implements OnDestroy {
  readonly locations = input<Location[]>([]);
  /** Id of the location whose children `locations` are — its footprint drives the scene. */
  readonly containerLocationId = input<string | null>(null);

  protected readonly collection = inject(CollectionService);
  protected readonly navigation = inject(NavigationService);
  protected readonly move = inject(MoveService);
  protected readonly text = createFloorPlan3dTranslations(inject(TranslationService));
  private readonly viewport = inject(ViewportService);
  private readonly geometry = inject(GeometryService);
  private readonly render = inject(RenderService);
  private readonly el = inject(ElementRef);

  constructor() {
    this.resetView();
    window.addEventListener('resize', this.onWindowResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onWindowResize);
  }

  private readonly onWindowResize = (): void => {
    this.applyFitScale();
  };

  /** Re-fits the footprint every time the rendered locations change. */
  private readonly refit = effect(() => {
    this.locations();
    untracked(() => this.applyFitScale());
  });

  /**
   * Orbit/zoom state, read from the template's `planeTransform()` call.
   * These must be signals, not plain fields: they are mutated from
   * `window.addEventListener` callbacks entirely outside Angular's own
   * listener wrapping, and this app runs zoneless change detection — see
   * the identical reasoning on `FloorPlanComponent.interactingLocationId`.
   */
  private readonly rotateZDeg = signal(INITIAL_ROTATE_Z);
  private readonly rotateXDeg = signal(0);
  private readonly scale = signal(1);

  private orbitState: OrbitState | null = null;
  private didDragSignificantly = false;
  private pinchStartDistance: number | null = null;
  private pinchStartScale = 1;

  planeTransform(): string {
    return `translateY(${this.visualCenterOffset()}px) scale(${this.scale()}) rotateX(${this.rotateXDeg()}deg) rotateZ(${this.rotateZDeg()}deg)`;
  }

  labelTransform(location: Location): string {
    const counter = `rotateZ(${-this.rotateZDeg()}deg)`;
    const points = this.outlinePoints3d(location);
    if (points.length < 4) {
      return counter;
    }
    const anchor = polygonLabelAnchor(points);
    return `translate(${anchor.x}px, ${anchor.y}px) translate(-50%, -50%) ${counter}`;
  }

  private visualCenterOffset(): number {
    const maxZ = this.maxStackZ();
    if (this.locations().length === 0 || maxZ === 0) {
      return 0;
    }
    const rad = (this.rotateXDeg() * Math.PI) / 180;
    return (maxZ * Math.sin(rad) / 2) * this.scale();
  }

  /** Nudges the orbit by a fixed step — an explicit alternative to drag-to-orbit. */
  rotate(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (direction === 'up') {
      this.rotateXDeg.set(Math.min(MAX_TILT, this.rotateXDeg() + ROTATE_STEP));
    } else if (direction === 'down') {
      this.rotateXDeg.set(Math.max(MIN_TILT, this.rotateXDeg() - ROTATE_STEP));
    } else if (direction === 'left') {
      this.rotateZDeg.set(this.rotateZDeg() - ROTATE_STEP);
    } else {
      this.rotateZDeg.set(this.rotateZDeg() + ROTATE_STEP);
    }
  }

  /** The plane must be big enough for every child's footprint. */
  bounds(): Rect {
    if (this.locations().length === 0) {
      return { ...FLOOR_FOOTPRINT };
    }
    return this.containerFootprint() ?? this.geometry.bounds(this.locations().map((location) => this.rectFor(location)));
  }

  /**
   * The selected parent's footprint when it has explicit dimensions, so the
   * scene's base plane represents the parent's space. Null for a parent with
   * none (e.g. a building, whose "space" is just its stacked floors).
   */
  private containerFootprint(): Rect | null {
    if (!this.containerLocationId()) {
      return null;
    }
    const parent = this.collection
      .dataset()
      .locations.find((candidate) => candidate.id === this.containerLocationId());
    if (!parent || typeof parent.width !== 'number' || typeof parent.height !== 'number') {
      return null;
    }
    return { x: 0, y: 0, width: parent.width, height: parent.height };
  }

  resetView(): void {
    this.rotateZDeg.set(INITIAL_ROTATE_Z);
    this.rotateXDeg.set(this.viewport.isMobile() ? MOBILE_INITIAL_ROTATE_X : DESKTOP_INITIAL_ROTATE_X);
    this.scale.set(this.fitScale());
  }

  private maxStackZ(): number {
    const floors = this.locations().filter((location) => location.type === 'floor');
    if (floors.length === 0) {
      return 0;
    }
    const stackHeight = this.viewport.isMobile() ? MOBILE_STACK_HEIGHT : FLOOR_STACK_HEIGHT;
    const topFloor = floors[floors.length - 1];
    return (floors.length - 1) * stackHeight + this.wallHeight(topFloor);
  }

  private fitScale(): number {
    const bounds = this.bounds();
    if (bounds.width <= 0 || bounds.height <= 0) {
      return 1;
    }
    const scene = this.sceneSize();
    const tilt = this.viewport.isMobile() ? MOBILE_INITIAL_ROTATE_X : DESKTOP_INITIAL_ROTATE_X;
    const rad = (tilt * Math.PI) / 180;
    const projectedHeight = bounds.height * Math.cos(rad) + this.maxStackZ() * Math.sin(rad);
    const availableWidth = Math.max(1, scene.width - SCENE_FIT_PADDING * 2);
    const availableHeight = Math.max(1, scene.height - SCENE_FIT_PADDING * 2);
    const scale = Math.min(availableWidth / bounds.width, availableHeight / projectedHeight);
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  }

  /** The scene's measured box, falling back to the window before it is laid out. */
  private sceneSize(): { width: number; height: number } {
    const scene = this.el.nativeElement.querySelector('.floor-plan-3d__scene') as HTMLElement | null;
    const width = scene?.clientWidth ?? 0;
    const height = scene?.clientHeight ?? 0;
    if (width > 0 && height > 0) {
      return { width, height };
    }
    if (this.viewport.isMobile()) {
      const viewport = Math.min(window.innerWidth, window.innerHeight);
      return { width: viewport, height: viewport * MOBILE_SCENE_HEIGHT_RATIO };
    }
    return { width: DESKTOP_SCENE_WIDTH, height: DESKTOP_SCENE_HEIGHT };
  }

  private applyFitScale(): void {
    const scale = this.fitScale();
    if (Number.isFinite(scale)) {
      this.scale.set(scale);
    }
  }

  rectFor(location: Location): Rect {
    if (location.type === 'floor') {
      return { ...FLOOR_FOOTPRINT };
    }
    return this.geometry.rectFor(location);
  }

  wallHeight(location: Location): number {
    if (location.type === 'floor' && this.viewport.isMobile()) {
      return MOBILE_WALL_HEIGHT;
    }
    return WALL_HEIGHT[location.type] ?? DEFAULT_WALL_HEIGHT;
  }

  /** Floors stack by their existing 2D `y` order; every other type sits flat on its own level. */
  elevationFor(location: Location): number {
    if (location.type !== 'floor') {
      return 0;
    }
    const stackHeight = this.viewport.isMobile() ? MOBILE_STACK_HEIGHT : FLOOR_STACK_HEIGHT;
    return this.floorIndex(location) * stackHeight;
  }

  /** A floor's position among its building's floors, ordered by the existing 2D `y` (see `seed.ts`'s `FLOOR_LAYOUT`). */
  private floorIndex(location: Location): number {
    const floors = this.locations().filter((candidate) => candidate.type === 'floor');
    const sorted = [...floors].sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
    return sorted.findIndex((candidate) => candidate.id === location.id);
  }

  countAt(locationId: string): number {
    return this.collection.locationItemCounts().get(locationId) ?? 0;
  }

  /** `siblings` sets the occupancy scale — the busiest of them gets the strongest colour. */
  occupancyColor(locationId: string, siblings: Location[], boost = 0): string {
    const max = Math.max(1, ...siblings.map((sibling) => this.countAt(sibling.id)));
    return this.render.occupancyColor(this.countAt(locationId), max, OCCUPANCY_PALETTE.map3dBaseAlpha, boost);
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
    return this.collection
      .dataset()
      .locations.filter((candidate) => candidate.parentId === location.id && typeof candidate.x !== 'number');
  }

  /**
   * Every face is a flat `left:0; top:0` rectangle rotated around its own
   * centre and then shifted into place with `translate3d`, rather than
   * hinged from an edge — hinging from an edge only produces a correctly
   * placed wall if the pre-rotation offset exactly cancels out, which is
   * easy to get subtly wrong. Rotating around the centre first means the
   * rotation never moves that centre point, so the required corrective
   * translation is a fixed, simple function of the wall's own half-thickness.
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

  /**
   * A shaped location's outline, scaled into the footprint this 3D view uses.
   * For rooms/cabinets that footprint equals the location's own `width`/`height`
   * (scale 1); for floors it is the shared `FLOOR_FOOTPRINT`, so the outline is
   * scaled down to match.
   */
  outlinePoints3d(location: Location): Point[] {
    const rect = this.rectFor(location);
    return (
      scaleOutline(location.outline, location.width ?? 0, location.height ?? 0, rect.width, rect.height) ?? []
    );
  }

  hasOutline(location: Location): boolean {
    return this.outlinePoints3d(location).length >= 4;
  }

  /** `clip-path` polygon for the shaped roof, or null for a plain rectangle. */
  topClipPath(location: Location): string | null {
    const points = this.outlinePoints3d(location);
    if (points.length < 4) {
      return null;
    }
    return `polygon(${points.map((point) => `${point.x}px ${point.y}px`).join(', ')})`;
  }

  /** One standing wall per outline edge, so a shaped room has walls on every side. */
  wallsFor(location: Location): WallFace[] {
    const points = this.outlinePoints3d(location);
    const height = this.wallHeight(location);
    return points.map((point, index) => this.wallFaceFor(point, points[(index + 1) % points.length], height));
  }

  private wallFaceFor(a: Point, b: Point, height: number): WallFace {
    const half = height / 2;
    if (a.y === b.y) {
      const length = Math.abs(b.x - a.x);
      const midX = (a.x + b.x) / 2;
      return {
        width: length,
        height,
        transform: `translate3d(${midX - length / 2}px, ${a.y - half}px, ${half}px) rotateX(-90deg)`,
      };
    }
    const length = Math.abs(b.y - a.y);
    const midY = (a.y + b.y) / 2;
    return {
      width: height,
      height: length,
      transform: `translate3d(${a.x - half}px, ${midY - length / 2}px, ${half}px) rotateY(90deg)`,
    };
  }

  onClick(locationId: string): void {
    // A drag that happened to start on top of a box (which now covers most
    // of the scene) still needs to orbit rather than select — suppress the
    // click that follows pointerup once the drag has moved past the
    // threshold, see `onOrbitPointerMove`.
    if (this.didDragSignificantly) {
      return;
    }
    if (this.move.movingItemId()) {
      this.move.requestMove(locationId);
      return;
    }
    this.navigation.selectLocation(locationId);
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