import { Component, ElementRef, effect, inject, input, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import type { Location, LocationType } from '../../../core/models';
import { DataService } from '../../data.service';
import { TranslationService } from '../../i18n/translation.service';
import { createLocationTypeTranslations } from '../../shared/location-type.translations';
import { ViewportService } from '../../shared/viewport.service';
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
  standalone: true,
  selector: 'app-floor-plan',
  imports: [MatButtonModule],
  templateUrl: './floor-plan.component.html',
  styleUrl: './floor-plan.component.scss',
})
export class FloorPlanComponent {
  readonly locations = input<Location[]>([]);
  /** Id of the location whose children `locations` are — used to look up/store its background plan image. */
  readonly containerLocationId = input<string | null>(null);

  protected readonly data = inject(DataService);
  protected readonly text = createFloorPlanTranslations(inject(TranslationService));
  protected readonly locationType = createLocationTypeTranslations(inject(TranslationService));
  protected readonly viewport = inject(ViewportService);

  protected readonly renderScale = signal(1);
  protected readonly showUploadMenu = signal(false);
  private readonly el = inject(ElementRef);

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
    return this.data.dataset().locations.find((candidate) => candidate.id === this.containerLocationId())?.mapImage;
  }

  private rawBounds(): Rect {
    const image = this.containerImage();
    if (this.locations().length === 0) {
      return { x: 0, y: 0, width: image?.width ?? 1, height: image?.height ?? 1 };
    }
    const maxX = Math.max(image?.width ?? 0, ...this.locations().map((location) => (location.x ?? 0) + (location.width ?? 0)));
    const maxY = Math.max(image?.height ?? 0, ...this.locations().map((location) => (location.y ?? 0) + (location.height ?? 0)));
    return { x: 0, y: 0, width: maxX, height: maxY };
  }

  bounds(): Rect {
    const s = this.renderScale();
    const raw = this.rawBounds();
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
    const raw = this.rawBounds();
    const viewport = this.el.nativeElement.querySelector('.floor-plan__viewport') as HTMLElement | null;
    const viewportWidth = viewport?.clientWidth ?? this.el.nativeElement.clientWidth;
    const fit = raw.width > 0 ? (viewportWidth - 16) / raw.width : 1;
    this.renderScale.set(Math.max(0.25, Math.min(1, fit)));
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
        this.data.setLocationMapImage(containerLocationId, dataUrl, image.naturalWidth, image.naturalHeight);
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.showUploadMenu.set(false);
    const containerLocationId = this.containerLocationId();
    if (containerLocationId) {
      this.data.clearLocationMapImage(containerLocationId);
    }
  }

  /** Returns the child type that should be added to the current container, or null if none. */
  childTypeToAdd(): LocationType | null {
    const firstChild = this.locations()[0]?.type;
    if (firstChild) {
      return firstChild;
    }
    const container = this.data.dataset().locations.find((candidate) => candidate.id === this.containerLocationId());
    if (!container) {
      return null;
    }
    const map: Record<LocationType, LocationType | null> = {
      building: 'floor',
      floor: 'room',
      room: 'cabinet',
      cabinet: 'drawer',
      drawer: 'box',
      box: 'tray',
      tray: 'position',
      position: null,
    };
    return map[container.type] ?? null;
  }

  addComponent(): void {
    const containerId = this.containerLocationId();
    const childType = this.childTypeToAdd();
    if (!containerId || !childType) {
      return;
    }
    const size = this.defaultSizeFor(childType);
    const position = this.nextPosition(size);
    const name = this.defaultName(childType);
    const label = this.locationType.label(childType);
    const chosen = window.prompt(`Nombre para el nuevo ${label}:`, name);
    if (chosen === null) {
      return;
    }
    const trimmed = chosen.trim();
    const finalName = trimmed || name;
    const id = `loc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    this.data.addLocation({
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

  private defaultSizeFor(type: LocationType): { width: number; height: number } {
    switch (type) {
      case 'floor':
        return { width: 600, height: 400 };
      case 'room':
        return { width: 184, height: 184 };
      case 'cabinet':
        return { width: 84, height: 164 };
      default:
        return { width: 100, height: 80 };
    }
  }

  private nextPosition(size: { width: number; height: number }): { x: number; y: number } {
    if (this.locations().length === 0) {
      return { x: 0, y: 0 };
    }
    const maxY = Math.max(...this.locations().map((location) => (location.y ?? 0) + (location.height ?? 0)));
    return { x: 0, y: maxY + 16 };
  }

  private defaultName(type: LocationType): string {
    const label = this.locationType.label(type);
    const containerId = this.containerLocationId()!;
    const count = this.data.dataset().locations.filter(
      (candidate) => candidate.parentId === containerId && candidate.type === type,
    ).length;
    return `${label} ${count + 1}`;
  }

  rectFor(location: Location): Rect {
    const s = this.renderScale();
    return {
      x: (location.x ?? 0) * s,
      y: (location.y ?? 0) * s,
      width: (location.width ?? 100) * s,
      height: (location.height ?? 100) * s,
    };
  }

  countAt(locationId: string): number {
    return this.data.locationItemCounts().get(locationId) ?? 0;
  }

  /** Background colour intensity relative to the busiest location currently shown, for an at-a-glance occupancy read. */
  occupancyBackground(locationId: string): string {
    const max = Math.max(1, ...this.locations().map((location) => this.countAt(location.id)));
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
   * building). Revealed as a scaled-down overlay on hover (see
   * `.floor-plan__preview` in the stylesheet) so the map gives some sense
   * of what's inside a container without permanently displacing its own
   * name/count or requiring navigation into it.
   */
  previewChildren(location: Location): Location[] {
    return this.data
      .dataset()
      .locations.filter((candidate) => candidate.parentId === location.id && typeof candidate.x === 'number');
  }

  /** The overlay covers almost the whole rect — it's hidden until hover, so it doesn't need to share space with anything. */
  previewArea(location: Location): Rect {
    const parentRect = this.rectFor(location);
    const inset = 4;
    return {
      x: inset,
      y: inset,
      width: Math.max(0, parentRect.width - inset * 2),
      height: Math.max(0, parentRect.height - inset * 2),
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
    this.data.updateLocationPosition(state.locationId, nextX, nextY);
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
    const nextWidth = Math.max(MIN_SIZE, Math.round(state.startWidth + dx));
    const nextHeight = Math.max(MIN_SIZE, Math.round(state.startHeight + dy));
    this.data.updateLocationSize(state.locationId, nextWidth, nextHeight);
  };

  private readonly onResizePointerUp = (): void => {
    window.removeEventListener('pointermove', this.onResizePointerMove);
    window.removeEventListener('pointerup', this.onResizePointerUp);
    this.resizeState = null;
    this.interactingLocationId.set(null);
  };
}
