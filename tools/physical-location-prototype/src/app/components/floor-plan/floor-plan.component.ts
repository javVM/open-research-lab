import { Component, ElementRef, effect, inject, input, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { Location, LocationType } from '../../../core/models';
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
    this.navigation.selectLocation(locationId);
  }

  onPointerDown(event: PointerEvent, location: Location): void {
    if (event.button !== 0 || this.viewport.isMobile()) {
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
    this.resizeState = null;
    this.interactingLocationId.set(null);
  };
}