import { Component, ElementRef, effect, inject, input, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { Location, LocationType, Point } from '../../../core/models';
import { edgeMidpoints, inwardNormal, labelAnchor as polygonLabelAnchor, moveVertex, notchEdge, outlineFor } from '../../../core/outline';
import { CollectionService } from '../../collection.service';
import { MoveService } from '../../move.service';
import { NavigationService } from '../../navigation.service';
import { TranslationService } from '../../i18n/translation.service';
import { createLocationTypeTranslations } from '../../shared/location-type.translations';
import { ViewportService } from '../../shared/viewport.service';
import { GeometryService, type Rect } from '../../shared/geometry.service';
import { RenderService } from '../../shared/render.service';
import { MIN_COMPONENT_SIZE } from '../../shared/geometry.constants';
import { defaultChildType } from '../../shared/hierarchy.constants';
import { OCCUPANCY_PALETTE } from '../../shared/palette.constants';
import { ID_PREFIX, newPrototypeId } from '../../shared/prototype-id';
import { registerAppIcons } from '../../shared/icons';
import { createFloorPlanTranslations } from './floor-plan.translations';
import { MIN_SHAPE_EDGE, NOTCH_MIN_DEPTH, NOTCH_WIDTH_RATIO } from './floor-plan.constants';

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

interface ShapeDragState {
  locationId: string;
  mode: 'vertex' | 'edge';
  index: number;
  startClientX: number;
  startClientY: number;
  startOutline: Point[];
  width: number;
  height: number;
  rectLeft: number;
  rectTop: number;
}

/**
 * A free-form 2D map of `locations`, each positioned at its own `x`/`y` and
 * sized by its own `width`/`height` (in arbitrary layout units, treated as
 * pixels here). Every location passed in must have all four set — the
 * caller (`LocationViewComponent`) only renders this when that holds for
 * the whole set of children, e.g. rooms within a building. Geometry and
 * occupancy colouring live in `GeometryService` and `RenderService`.
 */
@Component({
  standalone: true,
  selector: 'app-floor-plan',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './floor-plan.component.html',
  styleUrl: './floor-plan.component.scss',
})
export class FloorPlanComponent {
  readonly locations = input<Location[]>([]);
  /** Id of the location whose children `locations` are — used to look up/store its background plan image. */
  readonly containerLocationId = input<string | null>(null);

  protected readonly collection = inject(CollectionService);
  protected readonly navigation = inject(NavigationService);
  protected readonly move = inject(MoveService);
  protected readonly text = createFloorPlanTranslations(inject(TranslationService));
  protected readonly locationType = createLocationTypeTranslations(inject(TranslationService));
  protected readonly viewport = inject(ViewportService);
  protected readonly geometry = inject(GeometryService);
  private readonly render = inject(RenderService);

  protected readonly renderScale = signal(1);
  protected readonly showUploadMenu = signal(false);
  protected readonly shapeMode = signal(false);
  /** The location currently being shaped, set by clicking a rect in shape mode. */
  private readonly shapeTargetId = signal<string | null>(null);
  private readonly el = inject(ElementRef);

  constructor() {
    registerAppIcons();
  }

  private dragState: DragState | null = null;
  private suppressNextClick = false;
  /**
   * Set while a location is being dragged or resized, so its hover preview
   * can be suppressed — see template. This must be a signal, not a plain
   * field: it's mutated from `window.addEventListener` callbacks, entirely
   * outside Angular's own listener wrapping, and this app runs zoneless
   * change detection — a plain field write there would never mark the view
   * dirty, so the `[class.floor-plan__rect--interacting]` binding would
   * silently go stale even across an explicit `detectChanges()`.
   */
  private readonly interactingLocationId = signal<string | null>(null);

  isInteracting(locationId: string): boolean {
    return this.interactingLocationId() === locationId;
  }

  /** The background plan image set for `containerLocationId`, if any — see `Location.mapImage`. */
  containerImage(): Location['mapImage'] {
    if (!this.containerLocationId()) {
      return undefined;
    }
    return this.collection.dataset().locations.find((candidate) => candidate.id === this.containerLocationId())?.mapImage;
  }

  /** Scaled overall bounds of the map, matching the current render scale. */
  bounds(): Rect {
    const s = this.renderScale();
    const raw = this.geometry.bounds(this.locations(), this.containerImage());
    return { x: 0, y: 0, width: raw.width * s, height: raw.height * s };
  }

  private readonly refitOnInputChanges = effect(() => {
    this.locations();
    this.containerLocationId();
    untracked(() => this.fitToViewport());
  });

  private fitToViewport(): void {
    if (!this.viewport.isMobile()) {
      this.renderScale.set(1);
      return;
    }
    const raw = this.geometry.bounds(this.locations(), this.containerImage());
    const viewport = this.el.nativeElement.querySelector('.floor-plan__viewport') as HTMLElement | null;
    const viewportWidth = viewport?.clientWidth ?? this.el.nativeElement.clientWidth;
    this.renderScale.set(this.geometry.fitScale(raw.width, viewportWidth));
  }

  toggleUploadMenu(): void {
    this.showUploadMenu.update((open) => !open);
  }

  onImageSelected(event: Event): void {
    this.showUploadMenu.set(false);
    const input = event.target as HTMLInputElement;
    const containerLocationId = this.containerLocationId();
    const file = input.files?.[0];
    input.value = '';
    if (!file || !containerLocationId) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const image = new Image();
      image.onload = () => {
        this.collection.setLocationMapImage(containerLocationId, dataUrl, image.naturalWidth, image.naturalHeight);
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.showUploadMenu.set(false);
    const containerLocationId = this.containerLocationId();
    if (containerLocationId) {
      this.collection.clearLocationMapImage(containerLocationId);
    }
  }

  /** Returns the child type that should be added to the current container, or null if none. */
  childTypeToAdd(): LocationType | null {
    const firstChild = this.locations()[0]?.type;
    if (firstChild) {
      return firstChild;
    }
    const container = this.collection.dataset().locations.find((candidate) => candidate.id === this.containerLocationId());
    return container ? defaultChildType(container.type) : null;
  }

  addComponent(): void {
    const containerId = this.containerLocationId();
    const childType = this.childTypeToAdd();
    if (!containerId || !childType) {
      return;
    }
    const size = this.geometry.defaultSizeFor(childType);
    const position = this.geometry.nextPosition(this.locations(), size);
    const name = this.defaultName(childType);
    const label = this.locationType.label(childType);
    const chosen = window.prompt(`Nombre para el nuevo ${label}:`, name);
    if (chosen === null) {
      return;
    }
    const trimmed = chosen.trim();
    const finalName = trimmed || name;
    const id = newPrototypeId(ID_PREFIX.location);
    this.collection.addLocation({
      id,
      parentId: containerId,
      name: finalName,
      type: childType,
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
    });
  }

  private defaultName(type: LocationType): string {
    const label = this.locationType.label(type);
    const containerId = this.containerLocationId()!;
    const count = this.geometry.siblingCount(this.collection.dataset().locations, containerId, type);
    return `${label} ${count + 1}`;
  }

  rectFor(location: Location): Rect {
    return this.geometry.rectFor(location, this.renderScale());
  }

  countAt(locationId: string): number {
    return this.collection.locationItemCounts().get(locationId) ?? 0;
  }

  /** Background colour intensity relative to the busiest location currently shown, for an at-a-glance occupancy read. */
  occupancyBackground(locationId: string): string {
    const max = Math.max(1, ...this.locations().map((location) => this.countAt(location.id)));
    return this.render.occupancyColor(this.countAt(locationId), max, OCCUPANCY_PALETTE.mapBaseAlpha);
  }

  isDropTarget(): boolean {
    return Boolean(this.move.movingItemId());
  }

  /**
   * Direct children of `location` that themselves have floor-plan
   * coordinates (e.g. cabinets within a room, while viewing the room's
   * building). Revealed as a scaled-down overlay on hover (see
   * `.floor-plan__preview` in the stylesheet) so the map gives some sense
   * of what's inside a container without permanently displacing its own
   * name/count or requiring navigation into it.
   */
  previewChildren(location: Location): Location[] {
    return this.collection
      .dataset()
      .locations.filter((candidate) => candidate.parentId === location.id && typeof candidate.x === 'number');
  }

  /** The overlay covers almost the whole rect — it's hidden until hover, so it doesn't need to share space with anything. */
  previewArea(location: Location): Rect {
    return this.geometry.previewArea(this.rectFor(location));
  }

  previewRectFor(location: Location, child: Location): Rect {
    return this.geometry.previewRectFor(this.previewArea(location), this.previewChildren(location), child);
  }

  onClick(locationId: string): void {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }
    if (this.move.movingItemId()) {
      this.move.requestMove(locationId);
      return;
    }
    if (this.shapeMode()) {
      this.shapeTargetId.set(locationId);
      return;
    }
    this.navigation.selectLocation(locationId);
  }

  onPointerDown(event: PointerEvent, location: Location): void {
    if (event.button !== 0 || this.viewport.isMobile() || this.shapeMode()) {
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
    this.interactingLocationId.set(location.id);
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
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      state.moved = true;
    }
    const nextX = Math.max(0, Math.round(state.startX + dx));
    const nextY = Math.max(0, Math.round(state.startY + dy));
    this.collection.updateLocationPosition(state.locationId, nextX, nextY);
  };

  private readonly onPointerUp = (): void => {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    if (this.dragState?.moved) {
      this.suppressNextClick = true;
    }
    this.dragState = null;
    this.interactingLocationId.set(null);
  };

  private resizeState: ResizeState | null = null;

  private shapeDragState: ShapeDragState | null = null;

  onResizePointerDown(event: PointerEvent, location: Location): void {
    if (event.button !== 0 || this.viewport.isMobile()) {
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
    this.interactingLocationId.set(location.id);
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
    const nextWidth = Math.max(MIN_COMPONENT_SIZE, Math.round(state.startWidth + dx));
    const nextHeight = Math.max(MIN_COMPONENT_SIZE, Math.round(state.startHeight + dy));
    this.collection.updateLocationSize(state.locationId, nextWidth, nextHeight);
  };

  private readonly onResizePointerUp = (): void => {
    window.removeEventListener('pointermove', this.onResizePointerMove);
    window.removeEventListener('pointerup', this.onResizePointerUp);
    const locationId = this.resizeState?.locationId;
    this.resizeState = null;
    this.interactingLocationId.set(null);
    if (locationId) {
      this.collection.reflowChildrenInto(locationId);
    }
  };

  toggleShapeMode(): void {
    this.shapeMode.update((active) => !active);
    this.shapeTargetId.set(null);
  }

  resetShape(): void {
    const locationId = this.shapeTargetId();
    if (locationId) {
      this.collection.updateLocationOutline(locationId, null);
    }
  }

  isShapeTarget(locationId: string): boolean {
    return this.shapeMode() && this.shapeTargetId() === locationId;
  }

  /** The location currently targeted for shaping, when it is a child of this map. */
  selectedShapeLocation(): Location | null {
    if (!this.shapeMode()) {
      return null;
    }
    const id = this.shapeTargetId();
    return id ? (this.locations().find((location) => location.id === id) ?? null) : null;
  }

  outlinePoints(location: Location): Point[] {
    return outlineFor(location);
  }

  outlineMidpoints(location: Location): Point[] {
    return edgeMidpoints(outlineFor(location));
  }

  /** `clip-path` polygon for a shaped location, or null for a plain rectangle. */
  outlineClipPath(location: Location): string | null {
    const outline = location.outline;
    if (!outline || outline.length < 4) {
      return null;
    }
    const scale = this.renderScale();
    const points = outline
      .map((point) => `${(point.x * scale).toFixed(1)}px ${(point.y * scale).toFixed(1)}px`)
      .join(', ');
    return `polygon(${points})`;
  }

  /** On-render label position for a shaped location, so the name stays inside the outline. */
  labelAnchor(location: Location): { x: number; y: number } | null {
    const outline = location.outline;
    if (!outline || outline.length < 4) {
      return null;
    }
    const anchor = polygonLabelAnchor(outline);
    const scale = this.renderScale();
    return { x: anchor.x * scale, y: anchor.y * scale };
  }

  onVertexPointerDown(event: PointerEvent, location: Location, index: number): void {
    if (event.button !== 0 || this.viewport.isMobile()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.beginShapeDrag(event, location, 'vertex', index);
  }

  onEdgePointerDown(event: PointerEvent, location: Location, index: number): void {
    if (event.button !== 0 || this.viewport.isMobile()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.beginShapeDrag(event, location, 'edge', index);
  }

  private beginShapeDrag(event: PointerEvent, location: Location, mode: 'vertex' | 'edge', index: number): void {
    const rect = this.el.nativeElement.querySelector(
      `.floor-plan__rect[data-location-id="${location.id}"]`,
    ) as HTMLElement | null;
    const bounds = rect?.getBoundingClientRect() ?? { left: 0, top: 0 };
    this.shapeDragState = {
      locationId: location.id,
      mode,
      index,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOutline: outlineFor(location),
      width: location.width ?? 0,
      height: location.height ?? 0,
      rectLeft: bounds.left,
      rectTop: bounds.top,
    };
    window.addEventListener('pointermove', this.onShapePointerMove);
    window.addEventListener('pointerup', this.onShapePointerUp);
  }

  private readonly onShapePointerMove = (event: PointerEvent): void => {
    const state = this.shapeDragState;
    if (!state) {
      return;
    }
    if (state.mode === 'vertex') {
      this.dragVertex(state, event);
    } else {
      this.dragEdgeNotch(state, event);
    }
  };

  private dragVertex(state: ShapeDragState, event: PointerEvent): void {
    const point = state.startOutline[state.index];
    const nx = clampTo(point.x + event.clientX - state.startClientX, 0, state.width);
    const ny = clampTo(point.y + event.clientY - state.startClientY, 0, state.height);
    const moved = moveVertex(state.startOutline, state.index, nx, ny);
    if (minEdgeLength(moved) >= MIN_SHAPE_EDGE) {
      this.collection.updateLocationOutline(state.locationId, moved);
    }
  }

  private dragEdgeNotch(state: ShapeDragState, event: PointerEvent): void {
    const outline = state.startOutline;
    const a = outline[state.index];
    const b = outline[(state.index + 1) % outline.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    const normal = inwardNormal(outline, state.index);

    const px = event.clientX - state.rectLeft;
    const py = event.clientY - state.rectTop;
    const along = clampTo(((px - a.x) * ux + (py - a.y) * uy) / length, 0, 1);
    const depth = clampTo((px - a.x) * normal.x + (py - a.y) * normal.y, 0, Math.max(state.width, state.height));

    const notched = depth < NOTCH_MIN_DEPTH
      ? state.startOutline
      : notchEdge(state.startOutline, state.index, along, NOTCH_WIDTH_RATIO, depth);
    if (minEdgeLength(notched) >= MIN_SHAPE_EDGE) {
      this.collection.updateLocationOutline(state.locationId, notched);
    }
  }

  private readonly onShapePointerUp = (): void => {
    window.removeEventListener('pointermove', this.onShapePointerMove);
    window.removeEventListener('pointerup', this.onShapePointerUp);
    const locationId = this.shapeDragState?.locationId;
    this.shapeDragState = null;
    if (locationId) {
      this.collection.reflowChildrenInto(locationId);
    }
  };
}

function clampTo(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function minEdgeLength(points: readonly Point[]): number {
  let min = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    min = Math.min(min, Math.hypot(b.x - a.x, b.y - a.y));
  }
  return min;
}