import { AfterViewInit, Component, ElementRef, OnDestroy, effect, inject, input, signal, untracked } from '@angular/core';
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
import { PromptModalComponent, type PromptRequest } from '../prompt-modal/prompt-modal.component';
import { MAX_RENDER_SCALE, MIN_COMPONENT_SIZE, MIN_RENDER_SCALE, VIEWPORT_PADDING } from '../../shared/geometry.constants';
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

type ResizeAxis = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | 'x' | 'y' | 'xy';
interface ResizeState {
  locationId: string;
  axis: ResizeAxis;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
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
  imports: [MatButtonModule, MatIconModule, PromptModalComponent],
  templateUrl: './floor-plan.component.html',
  styleUrl: './floor-plan.component.scss',
})
export class FloorPlanComponent implements AfterViewInit, OnDestroy {
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
  protected readonly layoutMode = signal(false);
  protected readonly shapeMode = signal(false);
  /** The location currently being shaped, set by clicking a rect in shape mode. */
  private readonly shapeTargetId = signal<string | null>(null);
  private readonly el = inject(ElementRef);
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    registerAppIcons();
  }

  ngAfterViewInit(): void {
    const viewportEl = this.el.nativeElement.querySelector('.floor-plan__viewport') as HTMLElement | null;
    if (viewportEl && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.refit());
      this.resizeObserver.observe(viewportEl);
    }
    this.refit();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
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

  /**
   * The selected parent's footprint, when it has explicit dimensions. When the
   * parent has none (e.g. a building, whose "space" is simply its stacked
   * floors) this is null.
   */
  protected containerFootprint(): Rect | null {
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

  /**
   * The map canvas is exactly the parent's footprint (100% of its width and
   * height), so the whole canvas represents the parent's space. When the
   * parent has no dimensions (e.g. a building, whose "space" is its stacked
   * floors) it falls back to the children's own extent.
   */
  private mapFootprint(): Rect {
    return this.containerFootprint() ?? this.geometry.bounds(this.locations(), this.containerImage());
  }

  /** Scaled overall bounds of the map, matching the current render scale. */
  bounds(): Rect {
    const s = this.renderScale();
    const raw = this.mapFootprint();
    return { x: 0, y: 0, width: raw.width * s, height: raw.height * s };
  }

  private readonly refitOnInputChanges = effect(() => {
    this.locations();
    this.containerLocationId();
    untracked(() => this.refit());
  });

  /**
   * Scales the canvas to fit the parent footprint into the viewport while
   * preserving its aspect ratio (a square parent stays square), never
   * upscaling beyond natural size. Children are positioned in % of the
   * footprint, so a single uniform scale keeps everything aligned.
   */
  private refit(): void {
    const raw = this.mapFootprint();
    const viewportEl = this.el.nativeElement.querySelector('.floor-plan__viewport') as HTMLElement | null;
    const viewportWidth = viewportEl?.clientWidth ?? this.el.nativeElement.clientWidth;
    if (!viewportWidth || viewportWidth <= 0) {
      // Layout not measured yet (e.g. jsdom) — fall back to natural size.
      this.renderScale.set(1);
      return;
    }
    const availableWidth = Math.max(0, viewportWidth - VIEWPORT_PADDING);
    let scale = raw.width > 0 ? availableWidth / raw.width : MAX_RENDER_SCALE;
    // On mobile the height is flexible (the page scrolls), so fit by width
    // only; on desktop the canvas must also fit the available height.
    if (!this.viewport.isMobile()) {
      const viewportHeight = viewportEl?.clientHeight ?? 0;
      if (viewportHeight > 0 && raw.height > 0) {
        const availableHeight = Math.max(0, viewportHeight - VIEWPORT_PADDING);
        scale = Math.min(scale, availableHeight / raw.height);
      }
    }
    this.renderScale.set(Math.max(MIN_RENDER_SCALE, Math.min(MAX_RENDER_SCALE, scale)));
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
    const parentFootprint = this.containerFootprint();
    const position = this.geometry.nextPosition(this.locations(), size, parentFootprint);
    const name = this.defaultName(childType);
    void this.addComponentAsync(containerId, childType, size, position, name);
  }

  private async addComponentAsync(
    containerId: string,
    childType: LocationType,
    size: { width: number; height: number },
    position: Point,
    name: string,
  ): Promise<void> {
    const label = this.locationType.label(childType);
    const chosen = await this.askText(this.text.addComponentTitle(label), this.text.addComponentPrompt(label), name);
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

  protected readonly promptRequest = signal<PromptRequest | null>(null);
  private pendingPrompt: ((value: string | null) => void) | null = null;

  private askText(title: string, message: string, defaultValue: string): Promise<string | null> {
    return new Promise((resolve) => {
      this.pendingPrompt = resolve;
      this.promptRequest.set({
        kind: 'text',
        title,
        message,
        defaultValue,
        confirmLabel: this.text.addButton(),
        cancelLabel: this.text.cancelButton(),
      });
    });
  }

  onPromptConfirmed(value: string): void {
    this.closePrompt(value);
  }

  onPromptDismissed(): void {
    this.closePrompt(null);
  }

  private closePrompt(value: string | null): void {
    this.promptRequest.set(null);
    const resolve = this.pendingPrompt;
    this.pendingPrompt = null;
    resolve?.(value);
  }

  rectFor(location: Location): Rect {
    return this.geometry.rectFor(location, this.renderScale());
  }

  /** Rect expressed as percentages of the parent footprint — canvas is 100% x 100% of parent. */
  rectPercent(location: Location): { x: number; y: number; width: number; height: number } {
    const fp = this.mapFootprint();
    const w = fp.width || 1;
    const h = fp.height || 1;
    return {
      x: ((location.x ?? 0) / w) * 100,
      y: ((location.y ?? 0) / h) * 100,
      width: ((location.width ?? 0) / w) * 100,
      height: ((location.height ?? 0) / h) * 100,
    };
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

  /** Preview overlay inset-adjusted to the map element — percentages so it stretches with the rect. */
  previewRectPercent(location: Location, child: Location): { x: number; y: number; width: number; height: number } {
    const area = this.previewArea(location);
    const rect = this.previewRectFor(location, child);
    const aw = area.width || 1;
    const ah = area.height || 1;
    return {
      x: ((rect.x - area.x) / aw) * 100,
      y: ((rect.y - area.y) / ah) * 100,
      width: (rect.width / aw) * 100,
      height: (rect.height / ah) * 100,
    };
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
    if (this.layoutMode()) {
      return;
    }
    this.navigation.selectLocation(locationId);
  }

  onPointerDown(event: PointerEvent, location: Location): void {
    if (event.button !== 0 || this.viewport.isMobile() || !this.layoutMode()) {
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
    const rawDx = event.clientX - state.startClientX;
    const rawDy = event.clientY - state.startClientY;
    if (Math.abs(rawDx) > 8 || Math.abs(rawDy) > 8) {
      state.moved = true;
    }
    const scale = this.renderScale() || 1;
    const loc = this.locations().find((l) => l.id === state.locationId);
    const footprint = this.containerFootprint();
    let nextX = Math.max(0, Math.round(state.startX + rawDx / scale));
    let nextY = Math.max(0, Math.round(state.startY + rawDy / scale));
    if (footprint) {
      const maxX = Math.max(0, footprint.width - (loc?.width ?? MIN_COMPONENT_SIZE));
      const maxY = Math.max(0, footprint.height - (loc?.height ?? MIN_COMPONENT_SIZE));
      nextX = clampTo(nextX, 0, maxX);
      nextY = clampTo(nextY, 0, maxY);
    }
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

  onResizePointerDown(event: PointerEvent, location: Location, axis: ResizeAxis = 'se'): void {
    // normalize legacy aliases
    const norm: ResizeAxis = axis === 'x' ? 'e' : axis === 'y' ? 's' : axis === 'xy' ? 'se' : axis;
    if (event.button !== 0 || this.viewport.isMobile() || !this.layoutMode()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.resizeState = {
      locationId: location.id,
      axis: norm,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: location.x ?? 0,
      startY: location.y ?? 0,
      startWidth: location.width ?? MIN_COMPONENT_SIZE,
      startHeight: location.height ?? MIN_COMPONENT_SIZE,
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
    const scale = this.renderScale() || 1;
    const dx = (event.clientX - state.startClientX) / scale;
    const dy = (event.clientY - state.startClientY) / scale;
    const loc = this.locations().find((l) => l.id === state.locationId);
    const footprint = this.containerFootprint();
    let nextX = state.startX;
    let nextY = state.startY;
    let nextW = state.startWidth;
    let nextH = state.startHeight;

    if (state.axis.includes('e')) nextW = Math.max(MIN_COMPONENT_SIZE, Math.round(state.startWidth + dx));
    if (state.axis.includes('w')) {
      const rawW = Math.max(MIN_COMPONENT_SIZE, Math.round(state.startWidth - dx));
      const deltaW = rawW - state.startWidth;
      nextX = state.startX - deltaW;
      nextW = rawW;
    }
    if (state.axis.includes('s')) nextH = Math.max(MIN_COMPONENT_SIZE, Math.round(state.startHeight + dy));
    if (state.axis.includes('n')) {
      const rawH = Math.max(MIN_COMPONENT_SIZE, Math.round(state.startHeight - dy));
      const deltaH = rawH - state.startHeight;
      nextY = state.startY - deltaH;
      nextH = rawH;
    }

    if (footprint) {
      nextX = clampTo(nextX, 0, Math.max(0, footprint.width - nextW));
      nextY = clampTo(nextY, 0, Math.max(0, footprint.height - nextH));
      nextW = Math.min(nextW, footprint.width - nextX);
      nextH = Math.min(nextH, footprint.height - nextY);
    }
    if (nextX !== state.startX || nextY !== state.startY) {
      this.collection.updateLocationPosition(state.locationId, nextX, nextY);
    }
    this.collection.updateLocationSize(state.locationId, nextW, nextH);
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

  toggleLayoutMode(): void {
    const next = !this.layoutMode();
    this.layoutMode.set(next);
    if (next) {
      this.shapeMode.set(false);
      this.shapeTargetId.set(null);
    }
  }

  toggleShapeMode(): void {
    const next = !this.shapeMode();
    this.shapeMode.set(next);
    if (next) {
      this.layoutMode.set(false);
    }
    this.shapeTargetId.set(null);
  }

  zoomIn(): void {
    this.renderScale.update((s) => Math.min(MAX_RENDER_SCALE, Math.max(MIN_RENDER_SCALE, s * 1.25)));
  }

  zoomOut(): void {
    this.renderScale.update((s) => Math.min(MAX_RENDER_SCALE, Math.max(MIN_RENDER_SCALE, s / 1.25)));
  }

  zoomFit(): void {
    this.refit();
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

  outlinePointsString(location: Location): string | null {
    const o = this.renderableOutline(location);
    return o ? o.map((p) => `${p.x},${p.y}`).join(' ') : null;
  }

  /** On-render label position for a shaped location, so the name stays inside the outline. */
  labelAnchor(location: Location): { x: number; y: number } | null {
    const outline = this.renderableOutline(location);
    if (!outline) {
      return null;
    }
    const anchor = polygonLabelAnchor(outline);
    const w = location.width || 1;
    const h = location.height || 1;
    return { x: (anchor.x / w) * 100, y: (anchor.y / h) * 100 };
  }

  /**
   * The stored outline when it is safe to draw, else null. Guards against a
   * persisted outline left malformed by an earlier editing bug (NaN/negative
   * coordinates): such a polygon would fail to paint and let the near-black
   * canvas show through as a "black square".
   */
  private renderableOutline(location: Location): readonly Point[] | null {
    const o = location.outline;
    if (!o || o.length < 4) {
      return null;
    }
    if (!o.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.y >= 0)) {
      return null;
    }
    return o;
  }

  /** Shape handle position as % of the parent footprint (canvas is 100%). */
  shapeHandlePercent(location: Location, point: Point): { x: number; y: number } {
    const fp = this.mapFootprint();
    return {
      x: (((location.x ?? 0) + point.x) / (fp.width || 1)) * 100,
      y: (((location.y ?? 0) + point.y) / (fp.height || 1)) * 100,
    };
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
    const rectEl = this.el.nativeElement.querySelector(
      `.floor-plan__rect[data-location-id="${state.locationId}"]`,
    ) as HTMLElement | null;
    let scaleX = rectEl ? rectEl.getBoundingClientRect().width / (state.width || 1) : 1;
    let scaleY = rectEl ? rectEl.getBoundingClientRect().height / (state.height || 1) : 1;
    if (!scaleX || scaleX < 0.05) scaleX = 1;
    if (!scaleY || scaleY < 0.05) scaleY = 1;
    const point = state.startOutline[state.index];
    const nx = clampTo(point.x + (event.clientX - state.startClientX) / scaleX, 0, state.width);
    const ny = clampTo(point.y + (event.clientY - state.startClientY) / scaleY, 0, state.height);
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

    const rectEl = this.el.nativeElement.querySelector(
      `.floor-plan__rect[data-location-id="${state.locationId}"]`,
    ) as HTMLElement | null;
    let scaleX = rectEl ? rectEl.getBoundingClientRect().width / (state.width || 1) : 1;
    let scaleY = rectEl ? rectEl.getBoundingClientRect().height / (state.height || 1) : 1;
    if (!scaleX || scaleX < 0.05) scaleX = 1;
    if (!scaleY || scaleY < 0.05) scaleY = 1;
    const px = (event.clientX - state.rectLeft) / scaleX;
    const py = (event.clientY - state.rectTop) / scaleY;
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